/// <reference types="node" />
/**
 * Parses the "Routes" sheet in newData.xlsx into per-route seed data files
 * under seed/data/uat/routes-v2/, following the same one-file-per-item +
 * index.ts convention as seed/data/uat/venues-v2/, events-v2/ and clubs-v2/.
 *
 * Same enum-resolution approach as the other parse-*-data.ts scripts:
 * enum-backed columns are written in the sheet as human-readable names, not
 * slugs. This script resolves each value against seed/data/uat/enums/*.enum.ts
 * (exact name match, then slug-equivalence, then word-order-independent
 * match) and replaces it with the matching slug. Anything that still doesn't
 * match gets a freshly-minted slug recorded in
 * seed/data/uat/enums/data-discovered-additions.json, which
 * scripts/generate-enums.ts merges back in on its next run.
 *
 * Usage: npx tsx scripts/parse-routes-data.ts
 */
import XLSX from "xlsx";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { type EnumEntry, slugify, matchEnumValue } from "./lib/enum-matching.js";
import * as ENUMS from "../seed/data/uat/enums/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKBOOK_PATH = path.join(__dirname, "..", "newData.xlsx");
const SHEET_NAME = "Routes";
const OVERLAY_PATH = path.join(__dirname, "..", "seed", "data", "uat", "enums", "data-discovered-additions.json");
const OUTPUT_DIR = path.join(__dirname, "..", "seed", "data", "uat", "routes-v2");

const HEADER_ROW = 3; // 0-indexed grid row (Excel row 4): the snake_case field-name row
const FIRST_DATA_ROW = 4; // 0-indexed grid row (Excel row 5): first real data row
const NAME_FIELD = "route_name";

type Cell = string | number | boolean | Date | null;

// ── Enum registry (keys double as the overlay JSON's top-level keys) ────────

const ENUM_REGISTRY: Record<string, EnumEntry[]> = {
  OPPORTUNITY_TYPE_ENUM: ENUMS.OPPORTUNITY_TYPE_ENUM,
  OPPORTUNITY_THEME_ENUM: ENUMS.OPPORTUNITY_THEME_ENUM,
  OPPORTUNITY_THEME_VARIANT_ENUM: ENUMS.OPPORTUNITY_THEME_VARIANT_ENUM,
  ACTIVITY_GROUP_ENUM: ENUMS.ACTIVITY_GROUP_ENUM,
  ROUTE_TYPE_ENUM: ENUMS.ROUTE_TYPE_ENUM,
  ROUTE_SUITABILITY_ENUM: ENUMS.ROUTE_SUITABILITY_ENUM,
  TERRAIN_TYPE_ENUM: ENUMS.TERRAIN_TYPE_ENUM,
  ROUTE_DIFFICULTY_ENUM: ENUMS.ROUTE_DIFFICULTY_ENUM,
  PHYSICAL_SETTING_ENUM: ENUMS.PHYSICAL_SETTING_ENUM,
  WEATHER_SUITABILITY_ENUM: ENUMS.WEATHER_SUITABILITY_ENUM,
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
  console.warn(`[parse-routes-data] new enum value for ${enumKey}: "${rawValue}" -> "${newSlug}"`);
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
  | { kind: "numberString" }
  | { kind: "bool" }
  | { kind: "enumSingle"; enumKey: string }
  | { kind: "enumMulti"; enumKey: string };

interface ColumnConfig {
  sheetField: string;
  outputField: string;
  kind: FieldKind;
}

const enumSingle = (enumKey: string): FieldKind => ({ kind: "enumSingle", enumKey });
const enumMulti = (enumKey: string): FieldKind => ({ kind: "enumMulti", enumKey });

const COLUMNS: ColumnConfig[] = [
  { sheetField: "route_activity_grouping", outputField: "routeActivityGrouping", kind: enumMulti("ACTIVITY_GROUP_ENUM") },
  { sheetField: "route_description", outputField: "routeDescription", kind: { kind: "scalar" } },
  { sheetField: "route_type", outputField: "routeType", kind: enumMulti("ROUTE_TYPE_ENUM") },
  { sheetField: "route_suitability", outputField: "routeSuitability", kind: enumMulti("ROUTE_SUITABILITY_ENUM") },
  { sheetField: "route_distance", outputField: "routeDistance", kind: { kind: "scalar" } },
  { sheetField: "route_terrain_type", outputField: "routeTerrainType", kind: enumMulti("TERRAIN_TYPE_ENUM") },
  { sheetField: "route_difficulty", outputField: "routeDifficulty", kind: enumSingle("ROUTE_DIFFICULTY_ENUM") },
  { sheetField: "route_address_line_1", outputField: "routeAddressLine1", kind: { kind: "scalar" } },
  { sheetField: "route_address_line_2", outputField: "routeAddressLine2", kind: { kind: "scalar" } },
  { sheetField: "route_region", outputField: "routeRegion", kind: { kind: "scalar" } },
  { sheetField: "route_postcode", outputField: "routePostcode", kind: { kind: "scalar" } },
  { sheetField: "latitude", outputField: "latitude", kind: { kind: "numberString" } },
  { sheetField: "longitude", outputField: "longitude", kind: { kind: "numberString" } },
  { sheetField: "route_parking_provision", outputField: "routeParkingProvision", kind: enumMulti("PARKING_PROVISION_ENUM") },
  { sheetField: "route_general_facilities", outputField: "routeGeneralFacilities", kind: enumMulti("FUNCTIONAL_FACILITY_ENUM") },
  { sheetField: "route_child_facilities", outputField: "routeChildFacilities", kind: enumMulti("KIDS_FACILITY_ENUM") },
  { sheetField: "route_adult_facilities", outputField: "routeAdultFacilities", kind: enumMulti("PARENT_FACILITY_ENUM") },
  { sheetField: "route_dog_facilities", outputField: "routeDogFacilities", kind: enumMulti("DOG_FACILITY_ENUM") },
  { sheetField: "route_age_suitability_under_1_s", outputField: "routeAgeSuitabilityUnder1S", kind: { kind: "bool" } },
  { sheetField: "route_age_suitability_1_to_2_years", outputField: "routeAgeSuitability1To2Years", kind: { kind: "bool" } },
  { sheetField: "route_age_suitability_3_to_4_years", outputField: "routeAgeSuitability3To4Years", kind: { kind: "bool" } },
  { sheetField: "route_age_suitability_5_to_7_years", outputField: "routeAgeSuitability5To7Years", kind: { kind: "bool" } },
  { sheetField: "route_age_suitability_8_to_12_years", outputField: "routeAgeSuitability8To12Years", kind: { kind: "bool" } },
  { sheetField: "route_age_suitability_over_13_years", outputField: "routeAgeSuitabilityOver13Years", kind: { kind: "bool" } },
  { sheetField: "route_age_suitability_adults", outputField: "routeAgeSuitabilityAdults", kind: { kind: "bool" } },
  { sheetField: "route_physical_setting", outputField: "routePhysicalSetting", kind: enumSingle("PHYSICAL_SETTING_ENUM") },
  { sheetField: "route_detailed_weather_suitability", outputField: "routeDetailedWeatherSuitability", kind: enumMulti("WEATHER_SUITABILITY_ENUM") },
  { sheetField: "route_estimated_duration", outputField: "routeEstimatedDuration", kind: enumMulti("ESTIMATED_DURATION_ENUM") },
  { sheetField: "route_interest_tags", outputField: "routeInterestTags", kind: { kind: "scalar" } },
  { sheetField: "route_seasonal_tag", outputField: "routeSeasonalTag", kind: enumMulti("SEASONAL_TAG_ENUM") },
  { sheetField: "route_seasonal_highlights", outputField: "routeSeasonalHighlights", kind: enumMulti("SEASONAL_HIGHLIGHT_ENUM") },
  { sheetField: "route_attractions", outputField: "routeAttractions", kind: enumMulti("THEME_ATTRACTION_ENUM") },
  { sheetField: "route_extra_kit", outputField: "routeExtraKit", kind: enumMulti("EXTRA_KIT_ENUM") },
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
    case "bool": return toBoolOrNull(v);
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
    if (idx === undefined) throw new Error(`Column "${field}" not found in Routes sheet header`);
    return row[idx] ?? null;
  };

  const routeName = cellToStr(get(NAME_FIELD));
  if (!routeName) throw new Error(`Row ${rowNumber}: missing ${NAME_FIELD}`);

  const themeRaw = cellToStr(get("route_opportunity_theme"));
  const themeSlug = themeRaw ? resolveEnumValue("OPPORTUNITY_THEME_ENUM", themeRaw) : null;
  if (!themeSlug) throw new Error(`Row ${rowNumber} ("${routeName}"): missing route_opportunity_theme`);

  const variantRaw = cellToStr(get("route_opportunity_theme_variant"));
  let themeVariantSlug: string | null = null;
  if (variantRaw) {
    const variants = splitMultiValue(variantRaw);
    themeVariantSlug = variants.map((v) => resolveEnumValue("OPPORTUNITY_THEME_VARIANT_ENUM", v)).join(", ");
  }
  if (!themeVariantSlug) throw new Error(`Row ${rowNumber} ("${routeName}"): missing route_opportunity_theme_variant`);

  const opportunityTypeRaw = cellToStr(get("opportunity_type")) ?? "route";
  const opportunityType = resolveEnumValue("OPPORTUNITY_TYPE_ENUM", opportunityTypeRaw);

  const record: Record<string, OutputValue> = {
    themeSlug,
    themeVariantSlug,
    opportunityType,
    routeName,
  };

  for (const col of COLUMNS) {
    record[col.outputField] = parseCell(get(col.sheetField), col.kind);
  }

  // No column in the sheet for this — OpportunityRouteV2 has the field, but routes data never carries it.
  record.routeCountry = null;

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

function emitRouteFile(exportName: string, record: Record<string, OutputValue>): string {
  const lines: string[] = [];
  lines.push(`import type { OpportunityRouteV2SeedInput } from "../../../opportunity/routes-v2/create_opportunity_route_v2_row.js";`);
  lines.push(``);
  lines.push(`export const ${exportName}: OpportunityRouteV2SeedInput = {`);
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
    const routeName = record.routeName as string;
    const baseSlug = slugify(routeName);
    const count = (usedSlugs.get(baseSlug) ?? 0) + 1;
    usedSlugs.set(baseSlug, count);
    const fileSlug = count === 1 ? baseSlug : `${baseSlug}_${count}`;
    const exportName = `${toCamelCase(fileSlug)}RouteV2`;

    fs.writeFileSync(path.join(OUTPUT_DIR, `${fileSlug}.ts`), emitRouteFile(exportName, record));
    generated.push({ fileName: fileSlug, exportName });
  });

  const indexLines: string[] = [];
  indexLines.push(`import type { OpportunityRouteV2SeedInput } from "../../../opportunity/routes-v2/create_opportunity_route_v2_row.js";`);
  for (const g of generated) {
    indexLines.push(`import { ${g.exportName} } from "./${g.fileName}.js";`);
  }
  indexLines.push(``);
  // Named to match what seed/data/uat/routes-v2.ts already exported (a plain array).
  indexLines.push(`export const opportunityRouteV2SeedRows: OpportunityRouteV2SeedInput[] = [`);
  for (const g of generated) indexLines.push(`  ${g.exportName},`);
  indexLines.push(`];`);
  indexLines.push(``);
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), indexLines.join("\n"));

  fs.writeFileSync(OVERLAY_PATH, JSON.stringify(overlay, null, 2) + "\n");

  console.log(`Generated ${generated.length} route files in ${path.relative(process.cwd(), OUTPUT_DIR)}`);
  const newEnumCount = Object.values(overlay).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`New enum entries discovered: ${newEnumCount}`);
}

main();
