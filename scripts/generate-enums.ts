/// <reference types="node" />
/**
 * Generates seed/data/uat/enums/*.enum.ts from the "Enums" sheet in newData.xlsx.
 *
 * The sheet is a manually-maintained spreadsheet with merged cells (only the
 * first row of a repeating group carries enum_name/group_label, the rest are
 * blank) and ad-hoc "section header" rows. This script forward-fills those
 * merges, resolves cross-references between related enums (e.g. an
 * opportunity theme variant -> its parent theme), and emits one typed file
 * per enum concept plus an index barrel.
 *
 * Usage: npx tsx scripts/generate-enums.ts
 */
import XLSX from "xlsx";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { type EnumEntry, slugify, normalizeForMatch, matchByName } from "./lib/enum-matching.js";

/**
 * An entry while this script is building it up. Same base fields as the
 * shared EnumEntry, plus whatever specifically-named relation-slug arrays
 * get added along the way (e.g. `opportunityThemeSlugs`, `skillAreaSlugs`) —
 * which field names apply depends on which enum concept this is, so it's an
 * index signature rather than a fixed set of optional properties.
 */
type WorkingEntry = EnumEntry & Record<string, unknown>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKBOOK_PATH = path.join(__dirname, "..", "newData.xlsx");
const OUTPUT_DIR = path.join(__dirname, "..", "seed", "data", "uat", "enums");
const SHEET_NAME = "Enums";
const OVERLAY_PATH = path.join(OUTPUT_DIR, "data-discovered-additions.json");

const COL = {
  ENUM_NAME: 0,
  GROUP_LABEL: 1,
  VALUE_KEY: 2,
  VALUE_LABEL: 3,
  APPLIES_TO: 4,
  STATUS: 5,
} as const;

type Cell = string | number | boolean | null;

interface GenericRecord {
  enumName: string;
  groupLabel: string | null;
  valueKey: string | null;
  valueLabel: string;
  appliesTo: string | null;
  status: string | null;
}

interface AttractionRow {
  groupLabel: string;
  valueKey: string | null;
  valueLabel: string;
}

interface EnumFile {
  fileName: string;
  exportName: string;
  typeName: string;
  entries: WorkingEntry[];
}

// ── Cell / grid helpers ──────────────────────────────────────────────────────

function cellToStr(v: Cell | undefined): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function readGrid(): Cell[][] {
  const wb = XLSX.readFile(WORKBOOK_PATH);
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

function isBlankRow(row: Cell[]): boolean {
  return row.every((v) => cellToStr(v) === null);
}

function isSectionHeader(row: Cell[]): boolean {
  return cellToStr(row[0]) !== null && row.slice(1).every((v) => cellToStr(v) === null);
}

// ── Slugging ──────────────────────────────────────────────────────────────────

/** Known label mismatches between a relation-table's free text and the canonical enum entry it refers to (keys are pre-normalized via normalizeForMatch). */
const NAME_ALIASES: Record<string, string> = {
  "walks wanders": "Scenic Walks & Trails",
};

function resolveAlias(name: string): string {
  return NAME_ALIASES[normalizeForMatch(name)] ?? name;
}

function resolveActive(status: string | null): boolean {
  if (!status) return true;
  const s = status.toLowerCase();
  if (s === "active") return true;
  if (s === "inactive") return false;
  return true;
}

/**
 * Adds `slug` to entry[field] (creating the array on first use), where `field`
 * is a specific relation name like "opportunityThemeSlugs" or
 * "interestCategorySlugs" — not a single generic "relatedEnumNameSlugs" bucket.
 * A variant related to more than one parent (e.g. more than one opportunity
 * theme) just ends up with more than one slug in that same array.
 */
function addRelation(entry: WorkingEntry, field: string, slug: string): void {
  const existing = entry[field] as string[] | undefined;
  if (!existing) {
    entry[field] = [slug];
    return;
  }
  if (!existing.includes(slug)) existing.push(slug);
}

// ── Sheet parsing: forward-fill merges, split into generic + attraction rows ──

function parseSheet(grid: Cell[][]): {
  generic: Map<string, GenericRecord[]>;
  attractionRows: AttractionRow[];
} {
  const data = grid.slice(2); // row 0 is blank, row 1 is the header

  const generic = new Map<string, GenericRecord[]>();
  const attractionRows: AttractionRow[] = [];

  let state: { enumName: string | null; groupLabel: string | null } = { enumName: null, groupLabel: null };
  let inAttractionsSection = false;

  for (const row of data) {
    if (isSectionHeader(row)) {
      const title = cellToStr(row[0]) ?? "";
      inAttractionsSection = title.startsWith("Attractions");
      state = { enumName: null, groupLabel: null };
      continue;
    }
    if (isBlankRow(row)) {
      state = { enumName: null, groupLabel: null };
      continue;
    }

    const enumName = cellToStr(row[COL.ENUM_NAME]) ?? state.enumName;
    const groupLabel = cellToStr(row[COL.GROUP_LABEL]) ?? state.groupLabel;
    state = { enumName, groupLabel };

    const valueLabel = cellToStr(row[COL.VALUE_LABEL]);
    if (!valueLabel) continue;

    if (inAttractionsSection) {
      if (!groupLabel) continue;
      attractionRows.push({ groupLabel, valueKey: cellToStr(row[COL.VALUE_KEY]), valueLabel });
      continue;
    }

    if (!enumName) continue;
    const record: GenericRecord = {
      enumName,
      groupLabel,
      valueKey: cellToStr(row[COL.VALUE_KEY]),
      valueLabel,
      appliesTo: cellToStr(row[COL.APPLIES_TO]),
      status: cellToStr(row[COL.STATUS]),
    };
    const bucket = generic.get(enumName);
    if (bucket) bucket.push(record);
    else generic.set(enumName, [record]);
  }

  return { generic, attractionRows };
}

// ── Entry builders ────────────────────────────────────────────────────────────

/** slug from value_key when present (normalized), else slugified value_label. Dedupes within a file. */
function buildEntries(records: GenericRecord[]): WorkingEntry[] {
  const seen = new Set<string>();
  const entries: WorkingEntry[] = [];
  for (const r of records) {
    const base = slugify(r.valueKey ?? r.valueLabel);
    entries.push({ name: r.valueLabel, slug: dedupeSlug(base, r.groupLabel, seen), active: resolveActive(r.status) });
  }
  return entries;
}

/** Same as buildEntries but always slugs from value_label — for sections where value_key is repurposed (e.g. seasonal_highlights group markers). */
function buildEntriesFromLabelOnly(records: GenericRecord[]): WorkingEntry[] {
  const seen = new Set<string>();
  const entries: WorkingEntry[] = [];
  for (const r of records) {
    const base = slugify(r.valueLabel);
    entries.push({ name: r.valueLabel, slug: dedupeSlug(base, r.groupLabel, seen), active: resolveActive(r.status) });
  }
  return entries;
}

function dedupeSlug(base: string, groupLabel: string | null, seen: Set<string>): string {
  let slug = base;
  if (seen.has(slug)) {
    const withGroup = groupLabel ? `${base}_${slugify(groupLabel)}` : base;
    slug = seen.has(withGroup) ? `${base}_${seen.size}` : withGroup;
  }
  seen.add(slug);
  return slug;
}

function matchInterestCategoryByGroupLabel(groupLabel: string | null, categories: WorkingEntry[]): WorkingEntry | undefined {
  if (!groupLabel) return undefined;
  const stripped = groupLabel.replace(/\s+(Themes|Options)$/i, "");
  return matchByName(categories, stripped) ?? matchByName(categories, groupLabel);
}

function buildOpportunityThemeEntries(
  generic: Map<string, GenericRecord[]>,
  opportunityTypeEntries: WorkingEntry[],
  interestCategoryEntries: WorkingEntry[],
): WorkingEntry[] {
  const themeRecords = generic.get("opportunity_theme") ?? [];
  const entries = buildEntries(themeRecords);
  const bySlug = new Map(entries.map((e) => [e.slug, e]));

  // applies_to_type column on the theme's own row -> opportunity_type relation
  for (const r of themeRecords) {
    const entry = bySlug.get(slugify(r.valueKey ?? r.valueLabel));
    if (!entry || !r.appliesTo) continue;
    const tokens = r.appliesTo.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t && t !== "all" && t !== "-");
    for (const t of tokens) {
      const typeEntry = opportunityTypeEntries.find((e) => e.slug === t);
      if (typeEntry) addRelation(entry, "opportunityTypeSlugs", typeEntry.slug);
    }
  }

  // "Opportunity Themes mapped to each Opportunity Type" -> additional (union) type relation, matched by theme name
  for (const r of generic.get("opportunity_type_theme_options") ?? []) {
    const themeEntry = matchByName(entries, r.valueLabel);
    if (!themeEntry || !r.appliesTo) continue;
    const typeEntry = opportunityTypeEntries.find((e) => e.slug === r.appliesTo!.trim().toLowerCase());
    if (typeEntry) addRelation(themeEntry, "opportunityTypeSlugs", typeEntry.slug);
    else console.warn(`[opportunity-theme] no opportunity_type match for applies_to "${r.appliesTo}" (theme "${r.valueLabel}")`);
  }

  // "Opportunity Themes mapped to Interest Categories" -> interest_category relation, matched by theme slug (value_key)
  for (const r of generic.get("interest_category_options") ?? []) {
    if (!r.valueKey) continue; // sub-example rows (activity examples) carry no theme slug — skip
    // value_key here is sometimes a finer sub-option key that doesn't match the theme's own slug
    // (e.g. "active_play_climbing" for the "active_play" theme) — fall back to matching by label.
    const themeEntry = bySlug.get(slugify(r.valueKey)) ?? matchByName(entries, r.valueLabel);
    if (!themeEntry) {
      console.warn(`[opportunity-theme] interest_category_options value_key "${r.valueKey}" doesn't match any theme slug or label`);
      continue;
    }
    const categoryEntry = matchInterestCategoryByGroupLabel(r.groupLabel, interestCategoryEntries);
    if (categoryEntry) addRelation(themeEntry, "interestCategorySlugs", categoryEntry.slug);
    else console.warn(`[opportunity-theme] no interest_category match for group "${r.groupLabel}"`);
  }

  return entries;
}

function buildThemeVariantEntries(generic: Map<string, GenericRecord[]>, themeEntries: WorkingEntry[]): WorkingEntry[] {
  const records = [
    ...(generic.get("opportunity_theme_variant") ?? []),
    ...(generic.get("opportunity_theme_variant_walks") ?? []),
    ...(generic.get("opportunity_theme_variant_rideable") ?? []),
  ];
  const entries = buildEntries(records);
  records.forEach((r, i) => {
    const entry = entries[i];
    if (!entry) return;
    const theme = matchByName(themeEntries, r.groupLabel ?? "");
    if (theme) addRelation(entry, "opportunityThemeSlugs", theme.slug);
    else console.warn(`[opportunity-theme-variant] no theme match for group "${r.groupLabel}" (variant "${r.valueLabel}")`);
  });
  return entries;
}

function buildSkillAreaVariantEntries(generic: Map<string, GenericRecord[]>, skillAreaEntries: WorkingEntry[]): WorkingEntry[] {
  const records = generic.get("skill_area_variant") ?? [];
  const entries = buildEntries(records);
  records.forEach((r, i) => {
    const entry = entries[i];
    if (!entry) return;
    const area = matchByName(skillAreaEntries, r.groupLabel ?? "");
    if (area) addRelation(entry, "skillAreaSlugs", area.slug);
    else console.warn(`[skill-area-variant] no skill_area match for group "${r.groupLabel}"`);
  });
  return entries;
}

function buildSeasonalHighlightEntries(generic: Map<string, GenericRecord[]>, seasonalTagEntries: WorkingEntry[]): WorkingEntry[] {
  const records = generic.get("seasonal_highlights") ?? [];
  const entries = buildEntriesFromLabelOnly(records);
  let currentSeason: string | null = null;
  records.forEach((r, i) => {
    if (r.valueKey?.startsWith("seasonal_highlights_")) {
      currentSeason = r.valueKey.replace("seasonal_highlights_", "");
    }
    const entry = entries[i];
    if (!entry || !currentSeason) return;
    const tag = seasonalTagEntries.find((e) => e.slug === currentSeason);
    if (tag) addRelation(entry, "seasonalTagSlugs", tag.slug);
  });
  return entries;
}

function buildThemeAttractionEntries(attractionRows: AttractionRow[], themeEntries: WorkingEntry[]): WorkingEntry[] {
  const seen = new Set<string>();
  const entries: WorkingEntry[] = [];
  for (const r of attractionRows) {
    const base = slugify(r.valueKey ?? r.valueLabel);
    const slug = dedupeSlug(base, r.groupLabel, seen);
    const themeName = resolveAlias(r.groupLabel.replace(/\s+Attractions$/i, ""));
    const theme = matchByName(themeEntries, themeName);
    const entry: WorkingEntry = { name: r.valueLabel, slug, active: true };
    if (theme) addRelation(entry, "opportunityThemeSlugs", theme.slug);
    else console.warn(`[theme-attraction] no theme match for "${themeName}" (from group "${r.groupLabel}")`);
    entries.push(entry);
  }
  return entries;
}

// ── Simple (no-relation) enum files ──────────────────────────────────────────

const SIMPLE_ENUM_FILES: { enumName: string; fileName: string; exportName: string; typeName: string }[] = [
  { enumName: "opportunity_type", fileName: "opportunity-type", exportName: "OPPORTUNITY_TYPE_ENUM", typeName: "OpportunityType" },
  { enumName: "activity_group", fileName: "activity-group", exportName: "ACTIVITY_GROUP_ENUM", typeName: "ActivityGroup" },
  { enumName: "interest_category", fileName: "interest-category", exportName: "INTEREST_CATEGORY_ENUM", typeName: "InterestCategory" },
  { enumName: "general_skill", fileName: "general-skill", exportName: "GENERAL_SKILL_ENUM", typeName: "GeneralSkill" },
  { enumName: "detailed_weather_suitability", fileName: "weather-suitability", exportName: "WEATHER_SUITABILITY_ENUM", typeName: "WeatherSuitability" },
  { enumName: "physical_setting", fileName: "physical-setting", exportName: "PHYSICAL_SETTING_ENUM", typeName: "PhysicalSetting" },
  { enumName: "age_suitability", fileName: "age-suitability", exportName: "AGE_SUITABILITY_ENUM", typeName: "AgeSuitability" },
  { enumName: "estimated_duration", fileName: "estimated-duration", exportName: "ESTIMATED_DURATION_ENUM", typeName: "EstimatedDuration" },
  { enumName: "functional_facility", fileName: "functional-facility", exportName: "FUNCTIONAL_FACILITY_ENUM", typeName: "FunctionalFacility" },
  { enumName: "parent_facility", fileName: "parent-facility", exportName: "PARENT_FACILITY_ENUM", typeName: "ParentFacility" },
  { enumName: "kids_facility", fileName: "kids-facility", exportName: "KIDS_FACILITY_ENUM", typeName: "KidsFacility" },
  { enumName: "dog_facility", fileName: "dog-facility", exportName: "DOG_FACILITY_ENUM", typeName: "DogFacility" },
  { enumName: "parking_provision", fileName: "parking-provision", exportName: "PARKING_PROVISION_ENUM", typeName: "ParkingProvision" },
  { enumName: "extra_kit", fileName: "extra-kit", exportName: "EXTRA_KIT_ENUM", typeName: "ExtraKit" },
  { enumName: "seasonal_tag", fileName: "seasonal-tag", exportName: "SEASONAL_TAG_ENUM", typeName: "SeasonalTag" },
  { enumName: "route_type", fileName: "route-type", exportName: "ROUTE_TYPE_ENUM", typeName: "RouteType" },
  { enumName: "route_suitability", fileName: "route-suitability", exportName: "ROUTE_SUITABILITY_ENUM", typeName: "RouteSuitability" },
  { enumName: "terrain_type", fileName: "terrain-type", exportName: "TERRAIN_TYPE_ENUM", typeName: "TerrainType" },
  { enumName: "route_difficulty", fileName: "route-difficulty", exportName: "ROUTE_DIFFICULTY_ENUM", typeName: "RouteDifficulty" },
  { enumName: "club_format", fileName: "club-format", exportName: "CLUB_FORMAT_ENUM", typeName: "ClubFormat" },
  { enumName: "club_frequency", fileName: "club-frequency", exportName: "CLUB_FREQUENCY_ENUM", typeName: "ClubFrequency" },
  { enumName: "club_commitment", fileName: "club-commitment", exportName: "CLUB_COMMITMENT_ENUM", typeName: "ClubCommitment" },
  { enumName: "skill_area", fileName: "skill-area", exportName: "SKILL_AREA_ENUM", typeName: "SkillArea" },
  { enumName: "ability_level", fileName: "ability-level", exportName: "ABILITY_LEVEL_ENUM", typeName: "AbilityLevel" },
  { enumName: "event_type", fileName: "event-type", exportName: "EVENT_TYPE_ENUM", typeName: "EventType" },
  { enumName: "booking_type", fileName: "booking-type", exportName: "BOOKING_TYPE_ENUM", typeName: "BookingType" },
  { enumName: "ticket_variant", fileName: "ticket-variant", exportName: "TICKET_VARIANT_ENUM", typeName: "TicketVariant" },
];

// ── Emission ──────────────────────────────────────────────────────────────────

const BASE_FIELDS = new Set(["name", "slug", "active"]);

/** Union of relation field names (e.g. "opportunityThemeSlugs") across a file's entries, in first-seen order. */
function relationFieldNames(entries: WorkingEntry[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const e of entries) {
    for (const key of Object.keys(e)) {
      if (BASE_FIELDS.has(key) || seen.has(key)) continue;
      seen.add(key);
      order.push(key);
    }
  }
  return order;
}

function emitEnumFile(file: EnumFile): void {
  const relationFields = relationFieldNames(file.entries);

  const lines: string[] = [];
  lines.push(`export interface ${file.typeName}Entry {`);
  lines.push(`  name: string;`);
  lines.push(`  slug: string;`);
  for (const field of relationFields) lines.push(`  ${field}?: string[];`);
  lines.push(`  active: boolean;`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export const ${file.exportName}: ${file.typeName}Entry[] = [`);
  for (const e of file.entries) {
    const parts = [`name: ${JSON.stringify(e.name)}`, `slug: ${JSON.stringify(e.slug)}`];
    for (const field of relationFields) {
      const values = e[field] as string[] | undefined;
      if (values?.length) parts.push(`${field}: [${values.map((s) => JSON.stringify(s)).join(", ")}]`);
    }
    parts.push(`active: ${e.active}`);
    lines.push(`  { ${parts.join(", ")} },`);
  }
  lines.push(`];`);
  lines.push(``);
  lines.push(`export type ${file.typeName}Slug = (typeof ${file.exportName})[number]["slug"];`);
  lines.push(``);
  fs.writeFileSync(path.join(OUTPUT_DIR, `${file.fileName}.enum.ts`), lines.join("\n"));
}

function emitIndex(files: EnumFile[]): void {
  const lines = files.map((f) => `export * from "./${f.fileName}.enum.js";`);
  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), lines.join("\n") + "\n");
}

/**
 * Merges in enum values discovered while parsing real opportunity data (e.g.
 * scripts/parse-events-data.ts) that don't exist in the "Enums" sheet yet.
 * Keeps additions durable across re-runs of this script, since the generated
 * .enum.ts files themselves get fully overwritten every time.
 */
function mergeOverlay(files: EnumFile[]): void {
  if (!fs.existsSync(OVERLAY_PATH)) return;
  const overlay = JSON.parse(fs.readFileSync(OVERLAY_PATH, "utf8")) as Record<string, { name: string; slug: string }[]>;
  for (const file of files) {
    const additions = overlay[file.exportName];
    if (!additions?.length) continue;
    const existingSlugs = new Set(file.entries.map((e) => e.slug));
    for (const addition of additions) {
      if (existingSlugs.has(addition.slug)) continue;
      file.entries.push({ name: addition.name, slug: addition.slug, active: true });
      existingSlugs.add(addition.slug);
    }
  }
}

function validateRelations(files: EnumFile[]): void {
  const allSlugs = new Set<string>();
  const slugOwners = new Map<string, string[]>();
  for (const f of files) {
    for (const e of f.entries) {
      allSlugs.add(e.slug);
      const owners = slugOwners.get(e.slug) ?? [];
      owners.push(f.fileName);
      slugOwners.set(e.slug, owners);
    }
  }

  for (const [slug, owners] of slugOwners) {
    if (owners.length > 1) console.warn(`[validate] slug "${slug}" appears in multiple files: ${owners.join(", ")}`);
  }

  let hasError = false;
  for (const f of files) {
    for (const e of f.entries) {
      for (const field of relationFieldNames([e])) {
        for (const rel of (e[field] as string[] | undefined) ?? []) {
          if (!allSlugs.has(rel)) {
            hasError = true;
            console.error(`[validate] ${f.fileName}.enum.ts: entry "${e.slug}" references unknown ${field} "${rel}"`);
          }
        }
      }
    }
  }
  if (hasError) throw new Error("Enum relation validation failed — see errors above.");
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const grid = readGrid();
  const { generic, attractionRows } = parseSheet(grid);

  const files: EnumFile[] = [];
  for (const cfg of SIMPLE_ENUM_FILES) {
    const entries = buildEntries(generic.get(cfg.enumName) ?? []);
    if (entries.length === 0) console.warn(`[generate-enums] "${cfg.enumName}" produced 0 entries`);
    files.push({ fileName: cfg.fileName, exportName: cfg.exportName, typeName: cfg.typeName, entries });
  }

  const opportunityTypeEntries = files.find((f) => f.fileName === "opportunity-type")!.entries;
  const interestCategoryEntries = files.find((f) => f.fileName === "interest-category")!.entries;
  const skillAreaEntries = files.find((f) => f.fileName === "skill-area")!.entries;
  const seasonalTagEntries = files.find((f) => f.fileName === "seasonal-tag")!.entries;

  const opportunityThemeEntries = buildOpportunityThemeEntries(generic, opportunityTypeEntries, interestCategoryEntries);
  files.push({
    fileName: "opportunity-theme",
    exportName: "OPPORTUNITY_THEME_ENUM",
    typeName: "OpportunityTheme",
    entries: opportunityThemeEntries,
  });

  files.push({
    fileName: "opportunity-theme-variant",
    exportName: "OPPORTUNITY_THEME_VARIANT_ENUM",
    typeName: "OpportunityThemeVariant",
    entries: buildThemeVariantEntries(generic, opportunityThemeEntries),
  });

  files.push({
    fileName: "skill-area-variant",
    exportName: "SKILL_AREA_VARIANT_ENUM",
    typeName: "SkillAreaVariant",
    entries: buildSkillAreaVariantEntries(generic, skillAreaEntries),
  });

  files.push({
    fileName: "seasonal-highlight",
    exportName: "SEASONAL_HIGHLIGHT_ENUM",
    typeName: "SeasonalHighlight",
    entries: buildSeasonalHighlightEntries(generic, seasonalTagEntries),
  });

  files.push({
    fileName: "theme-attraction",
    exportName: "THEME_ATTRACTION_ENUM",
    typeName: "ThemeAttraction",
    entries: buildThemeAttractionEntries(attractionRows, opportunityThemeEntries),
  });

  mergeOverlay(files);

  validateRelations(files);

  for (const f of files) emitEnumFile(f);
  emitIndex(files);

  console.log(`Generated ${files.length} enum files in ${path.relative(process.cwd(), OUTPUT_DIR)}:`);
  for (const f of files) console.log(`  ${f.fileName}.enum.ts — ${f.entries.length} entries`);
}

main();
