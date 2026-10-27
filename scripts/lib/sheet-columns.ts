import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shared by the four parse-*-data.ts scripts so they can read both the older sheets (newData2.xlsx)
 * and the admin-tool exports (newDate3.xlsx onwards), whose headers drifted slightly.
 */

/** Sheet header renames: the name a parser's COLUMNS uses → other spellings that mean the same column. */
export const HEADER_ALIASES: Record<string, string[]> = {
  ticket_variant_definition__fixed_child: ["ticket_variant_definition_fixed_child"],
  club_committment: ["club_commitment"],
  // Events sheets used to carry a duplicate venue_* block; newer ones only have the event_* columns.
  venue_physical_setting: ["event_physical_setting"],
  venue_detailed_weather_suitability: ["event_detailed_weather_suitability"],
};

/** Header index for `field`, falling back through HEADER_ALIASES. */
export function findColumn(colIdx: Map<string, number>, field: string): number | undefined {
  const direct = colIdx.get(field);
  if (direct !== undefined) return direct;
  for (const alias of HEADER_ALIASES[field] ?? []) {
    const idx = colIdx.get(alias);
    if (idx !== undefined) return idx;
  }
  return undefined;
}

const warnedMissing = new Set<string>();

/** Columns only some sheets have (newer admin-tool exports) — read as null without a warning when absent. */
export const OPTIONAL_COLUMNS: ReadonlySet<string> = new Set(["partner_code", "regular_timetabled"]);

/** A column the parser expects is absent from this sheet (e.g. removed in a newer export) — read as null, warn once. */
export function warnMissingColumn(sheet: string, field: string): void {
  if (OPTIONAL_COLUMNS.has(field)) return;
  const key = `${sheet}:${field}`;
  if (warnedMissing.has(key)) return;
  warnedMissing.add(key);
  console.warn(`[${sheet}] column "${field}" not in sheet header — reading it as null`);
}

export type DeveloperAction = "CREATE" | "UPDATE" | "REMOVE";

/** Admin-tool bookkeeping columns (newDate3 onwards). Older sheets don't have them → nulls. */
export interface RowMeta {
  recordId: string | null;
  queuedVersion: number | null;
  action: DeveloperAction | null;
}

export function readRowMeta(header: string[], row: unknown[], cellToStr: (cell: any) => string | null): RowMeta {
  const cell = (name: string) => {
    const idx = header.indexOf(name);
    return idx === -1 ? null : cellToStr((row[idx] as any) ?? null);
  };
  const version = cell("queued_version");
  const action = cell("developer_action")?.toUpperCase();
  return {
    recordId: cell("record_id"),
    queuedVersion: version !== null && Number.isFinite(Number(version)) ? Number(version) : null,
    action: action === "CREATE" || action === "UPDATE" || action === "REMOVE" ? action : null,
  };
}

/** One sheet row, as returned by each parser's exported parse*Sheet(). A row the parser rejects
 * (e.g. a required column left blank) comes back with `record: null` and the reason in `error`. */
export interface ParsedSheetRow<R> {
  rowNumber: number;
  record: R | null;
  meta: RowMeta;
  error?: string;
}

/** True when `moduleUrl` is the script being run (`tsx scripts/x.ts`), false when it's imported. */
export function isDirectRun(moduleUrl: string): boolean {
  return !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(moduleUrl);
}
