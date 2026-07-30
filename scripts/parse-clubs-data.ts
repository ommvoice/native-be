/// <reference types="node" />
/**
 * Parses the "Clubs" sheet in newData.xlsx into per-club seed data files
 * under seed/data/uat/clubs-v2/, following the same one-file-per-item +
 * index.ts convention as seed/data/uat/venues-v2/ and events-v2/.
 *
 * newData.xlsx is the canonical source (kept in sync with seed/data/uat/uat.xlsx
 * manually elsewhere) — always read from here, not uat.xlsx.
 *
 * Same enum-resolution approach as scripts/parse-events-data.ts: enum-backed
 * columns are written in the sheet as human-readable names, not slugs. This
 * script resolves each value against seed/data/uat/enums/*.enum.ts (exact name
 * match, then slug-equivalence, then word-order-independent match) and
 * replaces it with the matching slug. Anything that still doesn't match gets
 * a freshly-minted slug recorded in seed/data/uat/enums/data-discovered-additions.json,
 * which scripts/generate-enums.ts merges back in on its next run.
 *
 * Usage: npx tsx scripts/parse-clubs-data.ts
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
const SHEET_NAME = "Clubs";
const OVERLAY_PATH = path.join(__dirname, "..", "seed", "data", "uat", "enums", "data-discovered-additions.json");
const OUTPUT_DIR = path.join(__dirname, "..", "seed", "data", "uat", "clubs-v2");
const TYPE_OUTPUT_PATH = path.join(__dirname, "..", "app", "shared", "assets", "types", "club.ts");

const HEADER_ROW = 3; // 0-indexed grid row (Excel row 4): the snake_case field-name row
const FIRST_DATA_ROW = 4; // 0-indexed grid row (Excel row 5): first real data row
const NAME_FIELD = "club_name";

/** Raw cell value plus SheetJS's pre-formatted display text (`w`), which reflects the number format
 * applied in Excel independent of the `cellDates` JS-Date conversion. Time-of-day cells are read from
 * `w` rather than from a converted Date: Excel's date-serial epoch is 1899-12-30, and JS Date's local
 * getHours()/getMinutes() re-derive that local time using the *historical* timezone rule in effect for
 * that date (e.g. pre-1900 Local Mean Time), which can silently disagree with the modern-day offset —
 * and a serial of exactly 1 ("24:00", i.e. open until midnight) round-trips through Date as the next
 * day's 00:00, indistinguishable from a genuine midnight start. `w` sidesteps both problems entirely.
 * It's also used as a fallback for scalar text Excel autocorrected into a date (e.g. an age range "1-3"). */
interface RawCell {
  v: string | number | boolean | Date | null;
  w?: string;
}
type Cell = RawCell | null;

// ── Enum registry (keys double as the overlay JSON's top-level keys) ────────

const ENUM_REGISTRY: Record<string, EnumEntry[]> = {
  OPPORTUNITY_TYPE_ENUM: ENUMS.OPPORTUNITY_TYPE_ENUM,
  OPPORTUNITY_THEME_ENUM: ENUMS.OPPORTUNITY_THEME_ENUM,
  OPPORTUNITY_THEME_VARIANT_ENUM: ENUMS.OPPORTUNITY_THEME_VARIANT_ENUM,
  ACTIVITY_GROUP_ENUM: ENUMS.ACTIVITY_GROUP_ENUM,
  CLUB_FORMAT_ENUM: ENUMS.CLUB_FORMAT_ENUM,
  CLUB_COMMITMENT_ENUM: ENUMS.CLUB_COMMITMENT_ENUM,
  CLUB_FREQUENCY_ENUM: ENUMS.CLUB_FREQUENCY_ENUM,
  PHYSICAL_SETTING_ENUM: ENUMS.PHYSICAL_SETTING_ENUM,
  BOOKING_TYPE_ENUM: ENUMS.BOOKING_TYPE_ENUM,
  TICKET_VARIANT_ENUM: ENUMS.TICKET_VARIANT_ENUM,
  PARKING_PROVISION_ENUM: ENUMS.PARKING_PROVISION_ENUM,
  FUNCTIONAL_FACILITY_ENUM: ENUMS.FUNCTIONAL_FACILITY_ENUM,
  KIDS_FACILITY_ENUM: ENUMS.KIDS_FACILITY_ENUM,
  PARENT_FACILITY_ENUM: ENUMS.PARENT_FACILITY_ENUM,
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
  console.warn(`[parse-clubs-data] new enum value for ${enumKey}: "${rawValue}" -> "${newSlug}"`);
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
      row.push(cell ? { v: cell.v as RawCell["v"], w: cell.w } : null);
    }
    grid.push(row);
  }
  return grid;
}

function cellToStr(v: Cell): string | null {
  if (v === null || v === undefined || v.v === null || v.v === undefined) return null;
  // Excel sometimes autocorrects free text that looks date-like (e.g. an age range "1-3") into a real
  // date value; `w` still holds the display text Excel showed, so fall back to that instead of dropping it.
  if (v.v instanceof Date) {
    const w = v.w?.trim();
    return w && w !== "-" ? w : null;
  }
  const s = String(v.v).trim();
  return s.length && s !== "-" ? s : null;
}

/** Splits a multi-value cell on commas, respecting double-quoted segments that themselves contain commas. */
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
  if (!v || !(v.v instanceof Date)) return null;
  const d = roundToNearestMinute(v.v);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Reads a time-of-day cell from its formatted display text rather than a converted Date (see RawCell
 * doc comment). Handles both real time cells ("07:00", "24:00:00") and any free-text time value Excel's
 * time format can't hold, like a literal "24:00". */
function toTimeString(v: Cell): string | null {
  const w = v?.w?.trim();
  if (!w || w === "-") return null;
  const match = /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/.exec(w);
  if (!match) return null;
  return `${match[1]!.padStart(2, "0")}:${match[2]!.padStart(2, "0")}`;
}

function toNumberOrNull(v: Cell): number | null {
  if (v === null || v === undefined || v.v === null || v.v === undefined) return null;
  if (typeof v.v === "number") return v.v;
  const s = cellToStr(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(v: Cell): string | null {
  if (v && typeof v.v === "number") return String(v.v);
  return cellToStr(v);
}

function toBoolOrNull(v: Cell): boolean | null {
  return v && typeof v.v === "boolean" ? v.v : null;
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

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const MIXED_TIMING_COLUMNS: ColumnConfig[] = DAYS.flatMap((day, i) => [
  { sheetField: `club_mixed_timings_${day}_start_time`, outputField: `clubMixedTimings${DAY_LABELS[i]}StartTime`, kind: { kind: "time" as const } },
  { sheetField: `club_mixed_timings_${day}_end_time`, outputField: `clubMixedTimings${DAY_LABELS[i]}EndTime`, kind: { kind: "time" as const } },
]);

const MULTI_SESSION_COLUMNS: ColumnConfig[] = DAYS.flatMap((day, i) => [
  { sheetField: `club_multi_session_${day}_session_total`, outputField: `clubMultiSession${DAY_LABELS[i]}SessionTotal`, kind: { kind: "number" as const } },
  { sheetField: `club_multi_session_${day}_schedule`, outputField: `clubMultiSession${DAY_LABELS[i]}Schedule`, kind: { kind: "scalar" as const } },
]);

const COLUMNS: ColumnConfig[] = [
  { sheetField: "club_description", outputField: "clubDescription", kind: { kind: "scalar" } },
  { sheetField: "club_format", outputField: "clubFormat", kind: enumSingle("CLUB_FORMAT_ENUM") },
  { sheetField: "club_committment", outputField: "clubCommittment", kind: enumSingle("CLUB_COMMITMENT_ENUM") },
  { sheetField: "club_frequency", outputField: "clubFrequency", kind: enumSingle("CLUB_FREQUENCY_ENUM") },
  { sheetField: "club_address_line_1", outputField: "clubAddressLine1", kind: { kind: "scalar" } },
  { sheetField: "club_address_line_2", outputField: "clubAddressLine2", kind: { kind: "scalar" } },
  { sheetField: "club_city_town", outputField: "clubCityTown", kind: { kind: "scalar" } },
  { sheetField: "club_state_region_province", outputField: "clubStateRegionProvince", kind: { kind: "scalar" } },
  { sheetField: "club_postcode", outputField: "clubPostcode", kind: { kind: "scalar" } },
  { sheetField: "club_country", outputField: "clubCountry", kind: { kind: "scalar" } },
  { sheetField: "latitude", outputField: "latitude", kind: { kind: "numberString" } },
  { sheetField: "longitude", outputField: "longitude", kind: { kind: "numberString" } },
  { sheetField: "club_start_date", outputField: "clubStartDate", kind: { kind: "date" } },
  { sheetField: "club_end_date", outputField: "clubEndDate", kind: { kind: "date" } },
  { sheetField: "club_repeat_session", outputField: "clubRepeatSession", kind: { kind: "bool" } },
  { sheetField: "club_daily_fixed_session_total", outputField: "clubDailyFixedSessionTotal", kind: { kind: "number" } },
  { sheetField: "club_daily_fixed_session_schedule", outputField: "clubDailyFixedSessionSchedule", kind: { kind: "scalar" } },
  { sheetField: "club_daily_schedule", outputField: "clubDailySchedule", kind: { kind: "scalar" } },
  { sheetField: "club_fixed_daily_timings", outputField: "clubFixedDailyTimings", kind: { kind: "bool" } },
  { sheetField: "club_daily_start_time", outputField: "clubDailyStartTime", kind: { kind: "time" } },
  { sheetField: "club_daily_end_time", outputField: "clubDailyEndTime", kind: { kind: "time" } },
  ...MIXED_TIMING_COLUMNS,
  ...MULTI_SESSION_COLUMNS,
  { sheetField: "club_monthly_schedule", outputField: "clubMonthlySchedule", kind: { kind: "scalar" } },
  { sheetField: "club_fixed_month_occurance", outputField: "clubFixedMonthOccurance", kind: { kind: "scalar" } },
  { sheetField: "club_monthly_occurance", outputField: "clubMonthlyOccurance", kind: { kind: "scalar" } },
  { sheetField: "club_monthly_fixed_dates", outputField: "clubMonthlyFixedDates", kind: { kind: "scalar" } },
  { sheetField: "ticketing_requirement", outputField: "ticketingRequirement", kind: { kind: "bool" } },
  { sheetField: "club_booking_provision", outputField: "clubBookingProvision", kind: enumMulti("BOOKING_TYPE_ENUM") },
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
  { sheetField: "club_parking_provision", outputField: "clubParkingProvision", kind: enumMulti("PARKING_PROVISION_ENUM") },
  { sheetField: "club_general_facilities", outputField: "clubGeneralFacilities", kind: enumMulti("FUNCTIONAL_FACILITY_ENUM") },
  { sheetField: "club_child_facilities", outputField: "clubChildFacilities", kind: enumMulti("KIDS_FACILITY_ENUM") },
  { sheetField: "club_adult_facilities", outputField: "clubAdultFacilities", kind: enumMulti("PARENT_FACILITY_ENUM") },
  { sheetField: "club_age_suitability_under_1_s", outputField: "clubAgeSuitabilityUnder1S", kind: { kind: "bool" } },
  { sheetField: "club_age_suitability_1_to_2_years", outputField: "clubAgeSuitability1To2Years", kind: { kind: "bool" } },
  { sheetField: "club_age_suitability_3_to_4_years", outputField: "clubAgeSuitability3To4Years", kind: { kind: "bool" } },
  { sheetField: "club_age_suitability_5_to_7_years", outputField: "clubAgeSuitability5To7Years", kind: { kind: "bool" } },
  { sheetField: "club_age_suitability_8_to_12_years", outputField: "clubAgeSuitability8To12Years", kind: { kind: "bool" } },
  { sheetField: "club_age_suitability_over_13_years", outputField: "clubAgeSuitabilityOver13Years", kind: { kind: "bool" } },
  { sheetField: "club_age_suitability_adults", outputField: "clubAgeSuitabilityAdults", kind: { kind: "bool" } },
  { sheetField: "club_activity_group", outputField: "clubActivityGroup", kind: enumMulti("ACTIVITY_GROUP_ENUM") },
  { sheetField: "club_physical_setting", outputField: "clubPhysicalSetting", kind: enumSingle("PHYSICAL_SETTING_ENUM") },
  { sheetField: "club_skill_area", outputField: "clubSkillArea", kind: enumMulti("SKILL_AREA_ENUM") },
  { sheetField: "club_skill_area_variant", outputField: "clubSkillAreaVariant", kind: enumMulti("SKILL_AREA_VARIANT_ENUM") },
  { sheetField: "club_ability_level", outputField: "clubAbilityLevel", kind: enumMulti("ABILITY_LEVEL_ENUM") },
  { sheetField: "club_interest_tags", outputField: "clubInterestTags", kind: { kind: "scalar" } },
  { sheetField: "club_seasonal_tag", outputField: "clubSeasonalTag", kind: enumMulti("SEASONAL_TAG_ENUM") },
  { sheetField: "club_seasonal_highlights", outputField: "clubSeasonalHighlights", kind: enumMulti("SEASONAL_HIGHLIGHT_ENUM") },
  { sheetField: "club_attractions", outputField: "clubAttractions", kind: enumMulti("THEME_ATTRACTION_ENUM") },
  { sheetField: "club_extra_kit", outputField: "clubExtraKit", kind: enumMulti("EXTRA_KIT_ENUM") },
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
    if (idx === undefined) throw new Error(`Column "${field}" not found in Clubs sheet header`);
    return row[idx] ?? null;
  };

  const clubName = cellToStr(get(NAME_FIELD));
  if (!clubName) throw new Error(`Row ${rowNumber}: missing ${NAME_FIELD}`);

  const themeRaw = cellToStr(get("club_opportunity_theme"));
  const themeSlug = themeRaw ? resolveEnumValue("OPPORTUNITY_THEME_ENUM", themeRaw) : null;
  if (!themeSlug) throw new Error(`Row ${rowNumber} ("${clubName}"): missing club_opportunity_theme`);

  const variantRaw = cellToStr(get("club_opportunity_theme_variant"));
  let themeVariantSlug: string | null = null;
  if (variantRaw) {
    const variants = splitMultiValue(variantRaw);
    themeVariantSlug = variants.map((v) => resolveEnumValue("OPPORTUNITY_THEME_VARIANT_ENUM", v)).join(", ");
  }
  if (!themeVariantSlug) throw new Error(`Row ${rowNumber} ("${clubName}"): missing club_opportunity_theme_variant`);

  const opportunityTypeRaw = cellToStr(get("opportunity_type")) ?? "club";
  const opportunityType = resolveEnumValue("OPPORTUNITY_TYPE_ENUM", opportunityTypeRaw);

  const record: Record<string, OutputValue> = {
    themeSlug,
    themeVariantSlug,
    opportunityType,
    clubName,
  };

  for (const col of COLUMNS) {
    record[col.outputField] = parseCell(get(col.sheetField), col.kind);
  }

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

function emitClubFile(exportName: string, record: Record<string, OutputValue>): string {
  const lines: string[] = [];
  lines.push(`import type { OpportunityClubV2SeedInput } from "../../../opportunity/clubs-v2/create_opportunity_club_v2_row.js";`);
  lines.push(``);
  lines.push(`export const ${exportName}: OpportunityClubV2SeedInput = {`);
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
  const nameColIdx = header.indexOf(NAME_FIELD);
  if (nameColIdx === -1) throw new Error(`Column "${NAME_FIELD}" not found in header row`);
  const dataRows = grid.slice(FIRST_DATA_ROW).filter((r) => cellToStr(r[nameColIdx] ?? null) !== null);

  const usedSlugs = new Map<string, number>();
  const generated: { fileName: string; exportName: string }[] = [];

  dataRows.forEach((row, i) => {
    const rowNumber = FIRST_DATA_ROW + i + 1;
    const record = parseRow(header, row, rowNumber);
    const clubName = record.clubName as string;
    const baseSlug = slugify(clubName);
    const count = (usedSlugs.get(baseSlug) ?? 0) + 1;
    usedSlugs.set(baseSlug, count);
    const fileSlug = count === 1 ? baseSlug : `${baseSlug}_${count}`;
    const exportName = `${toCamelCase(fileSlug)}ClubV2`;
    const recordWithId = { id: fileSlug, slug: fileSlug, ...record };

    fs.writeFileSync(path.join(OUTPUT_DIR, `${fileSlug}.ts`), emitClubFile(exportName, recordWithId));
    generated.push({ fileName: fileSlug, exportName });
  });

  const indexLines: string[] = [];
  indexLines.push(`import type { OpportunityClubV2SeedInput } from "../../../opportunity/clubs-v2/create_opportunity_club_v2_row.js";`);
  for (const g of generated) {
    indexLines.push(`import { ${g.exportName} } from "./${g.fileName}.js";`);
  }
  indexLines.push(``);
  // Named to match what seed/data/uat/clubs-v2.ts already exported (a plain array).
  indexLines.push(`export const opportunityClubV2SeedRows: OpportunityClubV2SeedInput[] = [`);
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
    { name: "clubName", tsType: "string" },
    ...COLUMNS.map((c) => ({ name: c.outputField, tsType: kindToTsType(c.kind) })),
  ];
  emitTypeFile(TYPE_OUTPUT_PATH, "Club", "scripts/parse-clubs-data.ts", typeFields);

  console.log(`Generated ${generated.length} club files in ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  const newEnumCount = Object.values(overlay).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`New enum entries discovered: ${newEnumCount}`);
}

main();
