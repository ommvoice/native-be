/// <reference types="node" />
/**
 * Parses the "Events" sheet in newData.xlsx into per-event seed data files
 * under seed/data/uat/events-v2/, following the same one-file-per-item +
 * index.ts convention as seed/data/uat/venues-v2/.
 *
 * Enum-backed columns (facilities, weather, activity group, etc.) are
 * written in the sheet as human-readable names, not slugs. This script
 * resolves each value against seed/data/uat/enums/*.enum.ts (exact name match,
 * then slug-equivalence, then word-order-independent match) and replaces it
 * with the matching slug. Any value that still doesn't match is a genuinely
 * new enum entry: it's minted a slug on the spot and recorded in
 * seed/data/uat/enums/data-discovered-additions.json, which
 * scripts/generate-enums.ts merges back into the generated enum files on its
 * next run — so the addition is durable across sheet re-generation.
 *
 * Usage: npx tsx scripts/parse-events-data.ts
 */
import XLSX from "xlsx";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { type EnumEntry, slugify, matchEnumValue } from "./lib/enum-matching.js";
import { emitTypeFile, type TypeField } from "./lib/emit-type.js";
import * as ENUMS from "../seed/data/uat/enums/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKBOOK_PATH = path.join(__dirname, "..", "newData.xlsx");
const SHEET_NAME = "Events";
const OVERLAY_PATH = path.join(__dirname, "..", "seed", "data", "uat", "enums", "data-discovered-additions.json");
const OUTPUT_DIR = path.join(__dirname, "..", "seed", "data", "uat", "events-v2");
const TYPE_OUTPUT_PATH = path.join(__dirname, "..", "app", "shared", "assets", "types", "event.ts");

const HEADER_ROW = 3; // 0-indexed grid row (Excel row 4): the snake_case field-name row
const FIRST_DATA_ROW = 4; // 0-indexed grid row (Excel row 5): first real data row

type Cell = string | number | boolean | Date | null;

// ── Enum registry (keys double as the overlay JSON's top-level keys) ────────

const ENUM_REGISTRY: Record<string, EnumEntry[]> = {
  OPPORTUNITY_TYPE_ENUM: ENUMS.OPPORTUNITY_TYPE_ENUM,
  OPPORTUNITY_THEME_ENUM: ENUMS.OPPORTUNITY_THEME_ENUM,
  OPPORTUNITY_THEME_VARIANT_ENUM: ENUMS.OPPORTUNITY_THEME_VARIANT_ENUM,
  ACTIVITY_GROUP_ENUM: ENUMS.ACTIVITY_GROUP_ENUM,
  EVENT_TYPE_ENUM: ENUMS.EVENT_TYPE_ENUM,
  PHYSICAL_SETTING_ENUM: ENUMS.PHYSICAL_SETTING_ENUM,
  WEATHER_SUITABILITY_ENUM: ENUMS.WEATHER_SUITABILITY_ENUM,
  BOOKING_TYPE_ENUM: ENUMS.BOOKING_TYPE_ENUM,
  TICKET_VARIANT_ENUM: ENUMS.TICKET_VARIANT_ENUM,
  PARKING_PROVISION_ENUM: ENUMS.PARKING_PROVISION_ENUM,
  FUNCTIONAL_FACILITY_ENUM: ENUMS.FUNCTIONAL_FACILITY_ENUM,
  KIDS_FACILITY_ENUM: ENUMS.KIDS_FACILITY_ENUM,
  PARENT_FACILITY_ENUM: ENUMS.PARENT_FACILITY_ENUM,
  DOG_FACILITY_ENUM: ENUMS.DOG_FACILITY_ENUM,
  ESTIMATED_DURATION_ENUM: ENUMS.ESTIMATED_DURATION_ENUM,
  SEASONAL_TAG_ENUM: ENUMS.SEASONAL_TAG_ENUM,
  SEASONAL_HIGHLIGHT_ENUM: ENUMS.SEASONAL_HIGHLIGHT_ENUM,
  THEME_ATTRACTION_ENUM: ENUMS.THEME_ATTRACTION_ENUM,
  EXTRA_KIT_ENUM: ENUMS.EXTRA_KIT_ENUM,
  SKILL_AREA_ENUM: ENUMS.SKILL_AREA_ENUM,
  SKILL_AREA_VARIANT_ENUM: ENUMS.SKILL_AREA_VARIANT_ENUM,
  ABILITY_LEVEL_ENUM: ENUMS.ABILITY_LEVEL_ENUM,
};

const overlay: Record<string, { name: string; slug: string }[]> = fs.existsSync(OVERLAY_PATH)
  ? JSON.parse(fs.readFileSync(OVERLAY_PATH, "utf8"))
  : {};

/** Resolves one free-text value against an enum, minting + recording a new entry if nothing matches. */
function resolveEnumValue(enumKey: string, rawValue: string): string {
  const entries = ENUM_REGISTRY[enumKey];
  if (!entries) throw new Error(`Unknown enum key "${enumKey}"`);
  const match = matchEnumValue(entries, rawValue);
  if (match) return match.slug;

  const newSlug = slugify(rawValue);
  const alreadyMinted = entries.find((e) => e.slug === newSlug);
  if (alreadyMinted) return alreadyMinted.slug;

  entries.push({ name: rawValue, slug: newSlug, active: true });
  const bucket = overlay[enumKey] ?? (overlay[enumKey] = []);
  bucket.push({ name: rawValue, slug: newSlug });
  console.warn(`[parse-events-data] new enum value for ${enumKey}: "${rawValue}" -> "${newSlug}"`);
  return newSlug;
}

// ── Grid / cell helpers ───────────────────────────────────────────────────────

function readGrid(): Cell[][] {
  const wb = XLSX.readFile(WORKBOOK_PATH, { cellDates: true });
  const sheet = wb.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found in ${WORKBOOK_PATH}`);
  const ref = sheet["!ref"];
  if (!ref) throw new Error(`Sheet "${SHEET_NAME}" has no populated range`);
  const range = XLSX.utils.decode_range(ref);
  const grid: Cell[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: Cell[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      row.push(cell ? (cell.v as Cell) : null);
    }
    grid.push(row);
  }
  return grid;
}

function cellToStr(v: Cell): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return null;
  const s = String(v).trim();
  return s.length && s !== "-" ? s : null;
}

/** Splits a multi-value cell on commas, respecting double-quoted segments that themselves contain commas (e.g. `Ice creams, "Swings, Slides, Climbing Frames", Outdoor play equipment`). */
function splitMultiValue(raw: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of raw) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { tokens.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens.map((t) => t.trim()).filter((t) => t && t !== "-");
}

/** Excel serial->JS Date conversion can drift a few seconds below midnight; round to the nearest minute before reading date/time components. */
function roundToNearestMinute(d: Date): Date {
  return new Date(Math.round(d.getTime() / 60000) * 60000);
}

function toDateOnly(v: Cell): Date | null {
  if (!(v instanceof Date)) return null;
  const d = roundToNearestMinute(v);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function toTimeString(v: Cell): string | null {
  if (!(v instanceof Date)) return null;
  const d = roundToNearestMinute(v);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toNumberOrNull(v: Cell): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const s = cellToStr(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(v: Cell): string | null {
  if (typeof v === "number") return String(v);
  return cellToStr(v);
}

function toBoolOrNull(v: Cell): boolean | null {
  return typeof v === "boolean" ? v : null;
}

// ── Column configuration ──────────────────────────────────────────────────────

type FieldKind =
  | { kind: "scalar" }
  | { kind: "numberString" } // numeric cell -> string field (ticket prices)
  | { kind: "number" }
  | { kind: "bool" }
  | { kind: "date" }
  | { kind: "time" }
  | { kind: "enumSingle"; enumKey: string }
  | { kind: "enumMulti"; enumKey: string };

interface ColumnConfig {
  sheetField: string;
  outputField: string;
  kind: FieldKind;
}

const enumSingle = (enumKey: string): FieldKind => ({ kind: "enumSingle", enumKey });
const enumMulti = (enumKey: string): FieldKind => ({ kind: "enumMulti", enumKey });

function kindToTsType(kind: FieldKind): string {
  switch (kind.kind) {
    case "scalar": return "string | null";
    case "numberString": return "string | null";
    case "number": return "number | null";
    case "bool": return "boolean | null";
    case "date": return "string | null";
    case "time": return "string | null";
    case "enumSingle": return "string | null";
    case "enumMulti": return "string | null";
  }
}

const COLUMNS: ColumnConfig[] = [
  { sheetField: "event_activity_group", outputField: "eventActivityGroup", kind: enumMulti("ACTIVITY_GROUP_ENUM") },
  { sheetField: "event_type", outputField: "eventType", kind: enumSingle("EVENT_TYPE_ENUM") },
  { sheetField: "event_description", outputField: "eventDescription", kind: { kind: "scalar" } },
  { sheetField: "event_address_line_1", outputField: "eventAddressLine1", kind: { kind: "scalar" } },
  { sheetField: "event_address_line_2", outputField: "eventAddressLine2", kind: { kind: "scalar" } },
  { sheetField: "event_city", outputField: "eventCity", kind: { kind: "scalar" } },
  { sheetField: "event_region", outputField: "eventRegion", kind: { kind: "scalar" } },
  { sheetField: "event_postcode", outputField: "eventPostcode", kind: { kind: "scalar" } },
  { sheetField: "event_country", outputField: "eventCountry", kind: { kind: "scalar" } },
  { sheetField: "latitude", outputField: "latitude", kind: { kind: "numberString" } },
  { sheetField: "longitude", outputField: "longitude", kind: { kind: "numberString" } },
  { sheetField: "event_physical_setting", outputField: "eventPhysicalSetting", kind: enumSingle("PHYSICAL_SETTING_ENUM") },
  { sheetField: "event_detailed_weather_suitability", outputField: "eventDetailedWeatherSuitability", kind: enumMulti("WEATHER_SUITABILITY_ENUM") },
  { sheetField: "event_start_date", outputField: "eventStartDate", kind: { kind: "date" } },
  { sheetField: "event_end_date", outputField: "eventEndDate", kind: { kind: "date" } },
  { sheetField: "event_days_total", outputField: "eventDaysTotal", kind: { kind: "number" } },
  { sheetField: "event_daily_multi_session", outputField: "eventDailyMultiSession", kind: { kind: "bool" } },
  { sheetField: "event_timetable_weekly", outputField: "eventTimetableWeekly", kind: { kind: "scalar" } },
  { sheetField: "event_daily_fixed_timings", outputField: "eventDailyFixedTimings", kind: { kind: "bool" } },
  { sheetField: "event_daily_fixed_start_time", outputField: "eventDailyFixedStartTime", kind: { kind: "time" } },
  { sheetField: "event_daily_fixed_end_time", outputField: "eventDailyFixedEndTime", kind: { kind: "time" } },
  { sheetField: "event_daily_multi_session_total", outputField: "eventDailyMultiSessionTotal", kind: { kind: "number" } },
  { sheetField: "event_daily_multi_session_timings", outputField: "eventDailyMultiSessionTimings", kind: { kind: "scalar" } },
  { sheetField: "event_weekly_fixed_start_time", outputField: "eventWeeklyFixedStartTime", kind: { kind: "time" } },
  { sheetField: "event_weekly_fixed_end_time", outputField: "eventWeeklyFixedEndTime", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_monday_start_time", outputField: "eventMixedTimingsMondayStart", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_monday_end_time", outputField: "eventMixedTimingsMondayEnd", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_tuesday_start_time", outputField: "eventMixedTimingsTuesdayStart", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_tuesday_end_time", outputField: "eventMixedTimingsTuesdayEnd", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_wednesday_start_time", outputField: "eventMixedTimingsWednesdayStart", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_wednesday_end_time", outputField: "eventMixedTimingsWednesdayEnd", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_thursday_start_time", outputField: "eventMixedTimingsThursdayStart", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_thursday_end_time", outputField: "eventMixedTimingsThursdayEnd", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_friday_start_time", outputField: "eventMixedTimingsFridayStart", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_friday_end_time", outputField: "eventMixedTimingsFridayEnd", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_saturday_start_time", outputField: "eventMixedTimingsSaturdayStart", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_saturday_end_time", outputField: "eventMixedTimingsSaturdayEnd", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_sunday_start_time", outputField: "eventMixedTimingsSundayStart", kind: { kind: "time" } },
  { sheetField: "event_mixed_timings_sunday_end_time", outputField: "eventMixedTimingsSundayEnd", kind: { kind: "time" } },
  { sheetField: "ticket_sales_start_date", outputField: "ticketSalesStartDate", kind: { kind: "date" } },
  { sheetField: "event_entry_cost", outputField: "eventEntryCost", kind: { kind: "bool" } },
  { sheetField: "event_booking_type", outputField: "eventBookingType", kind: enumMulti("BOOKING_TYPE_ENUM") },
  { sheetField: "ticketing_variants", outputField: "ticketingVariants", kind: enumMulti("TICKET_VARIANT_ENUM") },
  { sheetField: "ticket_variant_definition_baby", outputField: "ticketVariantDefinitionBaby", kind: { kind: "scalar" } },
  { sheetField: "ticket_variant_baby_price", outputField: "ticketVariantBabyPrice", kind: { kind: "numberString" } },
  { sheetField: "ticket_variant_definition__fixed_child", outputField: "ticketVariantDefinitionFixedChild", kind: { kind: "scalar" } },
  { sheetField: "ticket_variant_fixed_child_price", outputField: "ticketVariantFixedChildPrice", kind: { kind: "numberString" } },
  { sheetField: "ticket_variant_definition_young_child", outputField: "ticketVariantDefinitionYoungChild", kind: { kind: "scalar" } },
  { sheetField: "ticket_variant_young_child_price", outputField: "ticketVariantYoungChildPrice", kind: { kind: "numberString" } },
  { sheetField: "ticket_variant_definition_older_child", outputField: "ticketVariantDefinitionOlderChild", kind: { kind: "scalar" } },
  { sheetField: "ticket_variant_older_child_price", outputField: "ticketVariantOlderChildPrice", kind: { kind: "numberString" } },
  { sheetField: "ticket_variant_definition_adult", outputField: "ticketVariantDefinitionAdult", kind: { kind: "scalar" } },
  { sheetField: "ticket_variant_adult_price", outputField: "ticketVariantAdultPrice", kind: { kind: "numberString" } },
  { sheetField: "ticket_variant_definition_concession", outputField: "ticketVariantDefinitionConcession", kind: { kind: "scalar" } },
  { sheetField: "ticket_variant_concession_price", outputField: "ticketVariantConcessionPrice", kind: { kind: "numberString" } },
  { sheetField: "ticket_variant_definition_group", outputField: "ticketVariantDefinitionGroup", kind: { kind: "scalar" } },
  { sheetField: "ticket_variant_group_price", outputField: "ticketVariantGroupPrice", kind: { kind: "numberString" } },
  { sheetField: "event_parking_provision", outputField: "eventParkingProvision", kind: enumMulti("PARKING_PROVISION_ENUM") },
  { sheetField: "event_general_facilities", outputField: "eventGeneralFacilities", kind: enumMulti("FUNCTIONAL_FACILITY_ENUM") },
  { sheetField: "event_child_facilities", outputField: "eventChildFacilities", kind: enumMulti("KIDS_FACILITY_ENUM") },
  { sheetField: "event_adult_facilities", outputField: "eventAdultFacilities", kind: enumMulti("PARENT_FACILITY_ENUM") },
  { sheetField: "venue_dog_facilities", outputField: "eventVenueDogFacilities", kind: enumMulti("DOG_FACILITY_ENUM") },
  { sheetField: "event_age_suitability_under_1_s", outputField: "eventAgeSuitabilityUnder1S", kind: { kind: "bool" } },
  { sheetField: "event_age_suitability_1_to_2_years", outputField: "eventAgeSuitability1To2Years", kind: { kind: "bool" } },
  { sheetField: "event_age_suitability_3_to_4_years", outputField: "eventAgeSuitability3To4Years", kind: { kind: "bool" } },
  { sheetField: "event_age_suitability_5_to_7_years", outputField: "eventAgeSuitability5To7Years", kind: { kind: "bool" } },
  { sheetField: "event_age_suitability_8_to_12_years", outputField: "eventAgeSuitability8To12Years", kind: { kind: "bool" } },
  { sheetField: "event_age_suitability_over_13_years", outputField: "eventAgeSuitabilityOver13Years", kind: { kind: "bool" } },
  { sheetField: "event_age_suitability_adults", outputField: "eventAgeSuitabilityAdults", kind: { kind: "bool" } },
  { sheetField: "venue_physical_setting", outputField: "eventVenuePhysicalSetting", kind: enumSingle("PHYSICAL_SETTING_ENUM") },
  { sheetField: "venue_detailed_weather_suitability", outputField: "eventVenueDetailedWeatherSuitability", kind: enumMulti("WEATHER_SUITABILITY_ENUM") },
  { sheetField: "venue_estimated_duration", outputField: "eventVenueEstimatedDuration", kind: enumMulti("ESTIMATED_DURATION_ENUM") },
  { sheetField: "event_interest_tags", outputField: "eventInterestTags", kind: { kind: "scalar" } },
  { sheetField: "event_seasonal_tags", outputField: "eventSeasonalTags", kind: enumMulti("SEASONAL_TAG_ENUM") },
  { sheetField: "event_seasonal_highlights", outputField: "eventSeasonalHighlights", kind: enumMulti("SEASONAL_HIGHLIGHT_ENUM") },
  { sheetField: "event_highlights", outputField: "eventHighlights", kind: enumMulti("THEME_ATTRACTION_ENUM") },
  { sheetField: "event_extra_kit", outputField: "eventExtraKit", kind: enumMulti("EXTRA_KIT_ENUM") },
  { sheetField: "event_skill_area", outputField: "eventSkillArea", kind: enumMulti("SKILL_AREA_ENUM") },
  { sheetField: "event_skill_area_variant", outputField: "eventSkillAreaVariant", kind: enumMulti("SKILL_AREA_VARIANT_ENUM") },
  { sheetField: "event_ability_level", outputField: "eventAbilityLevel", kind: enumMulti("ABILITY_LEVEL_ENUM") },
  { sheetField: "image", outputField: "image", kind: { kind: "scalar" } },
];

// ── Row parsing ────────────────────────────────────────────────────────────────

type OutputValue = string | number | boolean | Date | null;

function parseCell(v: Cell, kind: FieldKind): OutputValue {
  switch (kind.kind) {
    case "scalar": return toStringOrNull(v);
    case "numberString": {
      const n = toNumberOrNull(v);
      return n === null ? toStringOrNull(v) : String(n);
    }
    case "number": return toNumberOrNull(v);
    case "bool": return toBoolOrNull(v);
    case "date": return toDateOnly(v);
    case "time": return toTimeString(v);
    case "enumSingle": {
      const s = cellToStr(v);
      return s ? resolveEnumValue(kind.enumKey, s) : null;
    }
    case "enumMulti": {
      const s = cellToStr(v);
      if (!s) return null;
      const tokens = splitMultiValue(s);
      if (tokens.length === 0) return null;
      return tokens.map((t) => resolveEnumValue(kind.enumKey, t)).join(", ");
    }
  }
}

function parseRow(header: string[], row: Cell[], rowNumber: number): Record<string, OutputValue> {
  const colIdx = new Map(header.map((h, i) => [h, i]));
  const get = (field: string): Cell => {
    const idx = colIdx.get(field);
    if (idx === undefined) throw new Error(`Column "${field}" not found in Events sheet header`);
    return row[idx] ?? null;
  };

  const eventName = cellToStr(get("event_name"));
  if (!eventName) throw new Error(`Row ${rowNumber}: missing event_name`);

  const themeRaw = cellToStr(get("event_opportunity_theme"));
  const themeSlug = themeRaw ? resolveEnumValue("OPPORTUNITY_THEME_ENUM", themeRaw) : null;
  if (!themeSlug) throw new Error(`Row ${rowNumber} ("${eventName}"): missing event_opportunity_theme`);

  const variantRaw = cellToStr(get("event_opportunity_theme_variant"));
  let themeVariantSlug: string | null = null;
  if (variantRaw) {
    const variants = splitMultiValue(variantRaw);
    themeVariantSlug = variants.map((v) => resolveEnumValue("OPPORTUNITY_THEME_VARIANT_ENUM", v)).join(", ");
  }
  if (!themeVariantSlug) throw new Error(`Row ${rowNumber} ("${eventName}"): missing event_opportunity_theme_variant`);

  const opportunityTypeRaw = cellToStr(get("opportunity_type")) ?? "event";
  const opportunityType = resolveEnumValue("OPPORTUNITY_TYPE_ENUM", opportunityTypeRaw);

  const record: Record<string, OutputValue> = {
    themeSlug,
    themeVariantSlug,
    opportunityType,
    eventName,
  };

  for (const col of COLUMNS) {
    record[col.outputField] = parseCell(get(col.sheetField), col.kind);
  }

  // No dedicated sheet column for this — mirror the entry-cost flag.
  record.ticketingRequirement = record.eventEntryCost ?? null;

  return record;
}

// ── Output file generation ──────────────────────────────────────────────────────

function toCamelCase(snake: string): string {
  return snake
    .split("_")
    .filter(Boolean)
    .map((w, i) => (i === 0 ? w : w[0]!.toUpperCase() + w.slice(1)))
    .join("");
}

function serializeValue(v: OutputValue): string {
  if (v === null) return "null";
  if (v instanceof Date) return `new Date(${JSON.stringify(v.toISOString())})`;
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  return JSON.stringify(v);
}

function emitEventFile(exportName: string, record: Record<string, OutputValue>): string {
  const lines: string[] = [];
  lines.push(`import type { OpportunityEventV2SeedInput } from "../../../opportunity/events-v2/create_opportunity_event_v2_row.js";`);
  lines.push(``);
  lines.push(`export const ${exportName}: OpportunityEventV2SeedInput = {`);
  for (const [key, value] of Object.entries(record)) {
    lines.push(`  ${key}: ${serializeValue(value)},`);
  }
  lines.push(`};`);
  lines.push(``);
  return lines.join("\n");
}

function main(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const grid = readGrid();
  const header = grid[HEADER_ROW]!.map((c) => cellToStr(c) ?? "");
  const dataRows = grid.slice(FIRST_DATA_ROW).filter((r) => cellToStr(r[3] ?? null) !== null); // col 3 = event_name

  const usedSlugs = new Map<string, number>();
  const generated: { fileName: string; exportName: string }[] = [];

  dataRows.forEach((row, i) => {
    const rowNumber = FIRST_DATA_ROW + i + 1;
    const record = parseRow(header, row, rowNumber);
    const eventName = record.eventName as string;
    const baseSlug = slugify(eventName);
    const count = (usedSlugs.get(baseSlug) ?? 0) + 1;
    usedSlugs.set(baseSlug, count);
    const fileSlug = count === 1 ? baseSlug : `${baseSlug}_${count}`;
    const exportName = `${toCamelCase(fileSlug)}EventV2`;
    const recordWithId = { id: fileSlug, slug: fileSlug, ...record };

    fs.writeFileSync(path.join(OUTPUT_DIR, `${fileSlug}.ts`), emitEventFile(exportName, recordWithId));
    generated.push({ fileName: fileSlug, exportName });
  });

  const indexLines: string[] = [];
  indexLines.push(`import type { OpportunityEventV2SeedInput } from "../../../opportunity/events-v2/create_opportunity_event_v2_row.js";`);
  for (const g of generated) {
    indexLines.push(`import { ${g.exportName} } from "./${g.fileName}.js";`);
  }
  indexLines.push(``);
  // Named to match what seed/index.ts already destructures (it accepts either
  // a function or a plain array under this name — see the typeof check there).
  indexLines.push(`export const opportunityEventV2SeedRows: OpportunityEventV2SeedInput[] = [`);
  for (const g of generated) indexLines.push(`  ${g.exportName},`);
  indexLines.push(`];`);
  indexLines.push(``);
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), indexLines.join("\n"));

  fs.writeFileSync(OVERLAY_PATH, JSON.stringify(overlay, null, 2) + "\n");

  const typeFields: TypeField[] = [
    { name: "id", tsType: "string" },
    { name: "slug", tsType: "string" },
    { name: "themeSlug", tsType: "string" },
    { name: "themeVariantSlug", tsType: "string" },
    { name: "opportunityType", tsType: "string" },
    { name: "eventName", tsType: "string" },
    ...COLUMNS.map((c) => ({ name: c.outputField, tsType: kindToTsType(c.kind) })),
    { name: "ticketingRequirement", tsType: "boolean | null" },
  ];
  emitTypeFile(TYPE_OUTPUT_PATH, "Event", "scripts/parse-events-data.ts", typeFields);

  console.log(`Generated ${generated.length} event files in ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  const newEnumCount = Object.values(overlay).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`New enum entries discovered: ${newEnumCount}`);
}

main();
