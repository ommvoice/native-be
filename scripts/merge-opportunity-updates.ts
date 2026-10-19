/// <reference types="node" />
/**
 * Merges an admin-tool sheet export (e.g. newDate3.xlsx) into the generated opportunity seed files
 * WITHOUT regenerating them — the seed files (and the JSON assets exported from them) carry manual
 * fixes that a fresh parse would lose.
 *
 * Per incoming row (matched to an existing record by record_id, or — for legacy records that predate
 * record ids — by name):
 *   - no match                              → create the record (record_id / queued_version from the sheet)
 *   - same recordId + queuedVersion         → unchanged
 *   - REMOVE                                → keep the record, set active: false (+ recordId / queuedVersion)
 *   - otherwise (CREATE / UPDATE)           → overwrite ONLY the fields whose value differs between the
 *                                             base sheet row (--base) and the incoming row; everything
 *                                             else, incl. manual fixes, is kept. id/slug never change.
 * Legacy records get recordId "0", queuedVersion 0, active true.
 *
 * Usage:
 *   npx tsx scripts/merge-opportunity-updates.ts --base newData2.xlsx --incoming newDate3.xlsx          # dry run
 *   npx tsx scripts/merge-opportunity-updates.ts --base newData2.xlsx --incoming newDate3.xlsx --apply
 * Then: npm run export:data-json  (JSON assets)  →  APP_ENV=uat npm run seed:opportunities  (DynamoDB)
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./lib/enum-matching.js";
import type { ParsedSheetRow } from "./lib/sheet-columns.js";
import * as venues from "./parse-venues-data.js";
import * as events from "./parse-events-data.js";
import * as clubs from "./parse-clubs-data.js";
import * as routes from "./parse-routes-data.js";
import { opportunityVenuesV2SeedItems } from "../seed/data/uat/venues-v2/index.js";
import { opportunityEventV2SeedRows } from "../seed/data/uat/events-v2/index.js";
import { opportunityClubV2SeedRows } from "../seed/data/uat/clubs-v2/index.js";
import { opportunityRouteV2SeedRows } from "../seed/data/uat/routes-v2/index.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OVERLAY_PATH = path.join(ROOT, "seed", "data", "uat", "enums", "data-discovered-additions.json");
const META_KEYS = ["id", "slug", "recordId", "queuedVersion", "active"] as const;

type Rec = Record<string, unknown>;

interface TypeConfig {
  label: string;
  dir: string;
  nameKey: string;
  exportSuffix: string;
  existing: Rec[];
  parse: (workbookPath: string) => ParsedSheetRow<Rec>[];
  emit: (exportName: string, record: any) => string;
  toCamelCase: (s: string) => string;
  writeTypeFile: () => void;
  overlay: Record<string, { name: string; slug: string }[]>;
}

const TYPES: TypeConfig[] = [
  { label: "Venues", dir: "venues-v2", nameKey: "venueName", exportSuffix: "VenueV2", existing: opportunityVenuesV2SeedItems as Rec[],
    parse: venues.parseVenuesSheet, emit: venues.emitVenueFile, toCamelCase: venues.toCamelCase, writeTypeFile: venues.writeTypeFile, overlay: venues.overlay },
  { label: "Events", dir: "events-v2", nameKey: "eventName", exportSuffix: "EventV2", existing: opportunityEventV2SeedRows as Rec[],
    parse: events.parseEventsSheet, emit: events.emitEventFile, toCamelCase: events.toCamelCase, writeTypeFile: events.writeTypeFile, overlay: events.overlay },
  { label: "Clubs", dir: "clubs-v2", nameKey: "clubName", exportSuffix: "ClubV2", existing: opportunityClubV2SeedRows as Rec[],
    parse: clubs.parseClubsSheet, emit: clubs.emitClubFile, toCamelCase: clubs.toCamelCase, writeTypeFile: clubs.writeTypeFile, overlay: clubs.overlay },
  { label: "Routes", dir: "routes-v2", nameKey: "routeName", exportSuffix: "RouteV2", existing: opportunityRouteV2SeedRows as Rec[],
    parse: routes.parseRoutesSheet, emit: routes.emitRouteFile, toCamelCase: routes.toCamelCase, writeTypeFile: routes.writeTypeFile, overlay: routes.overlay },
];

// ── CLI ───────────────────────────────────────────────────────────────────────

function arg(name: string): string {
  const i = process.argv.indexOf(name);
  const value = i === -1 ? undefined : process.argv[i + 1];
  if (!value) throw new Error(`Missing ${name} <file.xlsx>`);
  const resolved = path.resolve(ROOT, value);
  if (!fs.existsSync(resolved)) throw new Error(`${name}: ${resolved} not found`);
  return resolved;
}
const apply = process.argv.includes("--apply");
const basePath = arg("--base");
const incomingPath = arg("--incoming");

// ── Helpers ──────────────────────────────────────────────────────────────────

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const show = (v: unknown) => {
  const s = JSON.stringify(v instanceof Date ? v.toISOString().slice(0, 10) : v ?? null);
  return s.length > 70 ? `${s.slice(0, 67)}…` : s;
};
const nameSlug = (r: Rec, t: TypeConfig) => slugify(String(r[t.nameKey] ?? ""));

/** Meta fields first (id, slug, recordId, queuedVersion, active), then the record's own field order. */
function orderRecord(r: Rec): Rec {
  const out: Rec = {};
  for (const k of META_KEYS) if (k in r) out[k] = r[k];
  for (const [k, v] of Object.entries(r)) if (!(k in out)) out[k] = v;
  return out;
}

/** Group by key; keys with >1 entry are ambiguous for name matching. */
function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const item of items) m.set(key(item), [...(m.get(key(item)) ?? []), item]);
  return m;
}

/** Sets recordId / queuedVersion / active on a record file in place (text edit, so manual formatting is kept). */
function setMetaInFile(file: string, meta: { recordId: string; queuedVersion: number; active: boolean }): void {
  let src = fs.readFileSync(file, "utf8");
  const lines: Record<string, string> = {
    recordId: `  recordId: ${JSON.stringify(meta.recordId)},`,
    queuedVersion: `  queuedVersion: ${meta.queuedVersion},`,
    active: `  active: ${meta.active},`,
  };
  const missing: string[] = [];
  for (const [key, line] of Object.entries(lines)) {
    const re = new RegExp(`^  ${key}: .*,$`, "m");
    if (re.test(src)) src = src.replace(re, line);
    else missing.push(line);
  }
  if (missing.length) {
    const slugLine = /^  slug: .*,$/m;
    if (!slugLine.test(src)) throw new Error(`${file}: no "slug:" line to anchor record metadata after`);
    src = src.replace(slugLine, (m) => [m, ...missing].join("\n"));
  }
  fs.writeFileSync(file, src);
}

/** Appends new item imports + array entries to a seed folder's index.ts, keeping its existing format. */
function appendToIndex(indexFile: string, items: { exportName: string; fileName: string }[]): void {
  if (!items.length) return;
  let src = fs.readFileSync(indexFile, "utf8");
  const importLines = [...src.matchAll(/^import \{ \w+ \} from "\.\/[^"]+\.js";$/gm)];
  const lastImport = importLines[importLines.length - 1];
  if (!lastImport) throw new Error(`${indexFile}: no item imports found`);
  const at = lastImport.index! + lastImport[0].length;
  src = src.slice(0, at) + items.map((i) => `\nimport { ${i.exportName} } from "./${i.fileName}.js";`).join("") + src.slice(at);
  const close = src.lastIndexOf("];");
  if (close === -1) throw new Error(`${indexFile}: no closing "];"`);
  src = src.slice(0, close) + items.map((i) => `  ${i.exportName},\n`).join("") + src.slice(close);
  fs.writeFileSync(indexFile, src);
}

// ── Merge ────────────────────────────────────────────────────────────────────

interface Plan {
  creates: { id: string; record: Rec; label: string }[];
  updates: { id: string; record: Rec; label: string; changes: string[]; fullReplace: boolean }[];
  removes: { id: string; meta: { recordId: string; queuedVersion: number }; label: string }[];
  unchanged: string[];
  legacy: string[];
  warnings: string[];
}

function planType(t: TypeConfig): Plan {
  const plan: Plan = { creates: [], updates: [], removes: [], unchanged: [], legacy: [], warnings: [] };
  const existing = t.existing;
  const takenIds = new Set(existing.map((r) => String(r.id)));
  const byRecordId = new Map(existing.filter((r) => r.recordId && r.recordId !== "0").map((r) => [String(r.recordId), r]));
  const legacyByName = groupBy(existing.filter((r) => !r.recordId || r.recordId === "0"), (r) => nameSlug(r, t));
  plan.legacy = existing.filter((r) => r.recordId === undefined).map((r) => String(r.id));

  const baseByName = groupBy(t.parse(basePath).filter((row) => row.record), (row) => nameSlug(row.record!, t));
  const baseByRecordId = new Map<string, ParsedSheetRow<Rec>>();
  for (const rows of baseByName.values()) for (const row of rows) if (row.meta.recordId) baseByRecordId.set(row.meta.recordId, row);

  for (const row of t.parse(incomingPath)) {
    if (!row.record) {
      plan.warnings.push(`row ${row.rowNumber} (${row.meta.recordId ?? "no record_id"}): ${row.error} — skipped, fix in the sheet`);
      continue;
    }
    const { record, meta } = row;
    const name = String(record[t.nameKey]);
    const label = `${name} [${meta.action ?? "?"} ${meta.recordId ?? "no record_id"} v${meta.queuedVersion ?? "?"}]`;
    if (!meta.recordId || meta.queuedVersion === null) {
      plan.warnings.push(`row ${row.rowNumber} ${name}: missing record_id or queued_version — skipped`);
      continue;
    }

    let target = byRecordId.get(meta.recordId);
    if (!target) {
      const candidates = legacyByName.get(nameSlug(record, t)) ?? [];
      if (candidates.length > 1) {
        plan.warnings.push(`${label}: name matches ${candidates.length} legacy records (${candidates.map((c) => c.id).join(", ")}) — skipped, resolve by hand`);
        continue;
      }
      target = candidates[0];
    }

    if (!target) {
      if (meta.action === "REMOVE") {
        plan.warnings.push(`${label}: REMOVE for a record that doesn't exist — skipped`);
        continue;
      }
      let id = nameSlug(record, t);
      for (let n = 2; takenIds.has(id); n++) id = `${nameSlug(record, t)}_${n}`;
      takenIds.add(id);
      plan.creates.push({ id, label, record: orderRecord({ id, slug: id, recordId: meta.recordId, queuedVersion: meta.queuedVersion, active: true, ...record }) });
      continue;
    }

    const id = String(target.id);
    if (target.recordId === meta.recordId && target.queuedVersion === meta.queuedVersion) {
      plan.unchanged.push(label);
      continue;
    }
    if (meta.action === "REMOVE") {
      plan.removes.push({ id, label, meta: { recordId: meta.recordId, queuedVersion: meta.queuedVersion } });
      continue;
    }

    // Only the fields the sheet actually changed between base and incoming — manual fixes elsewhere survive.
    const baseCandidates = baseByRecordId.has(meta.recordId) ? [baseByRecordId.get(meta.recordId)!] : baseByName.get(nameSlug(record, t)) ?? [];
    const base = baseCandidates.length === 1 ? baseCandidates[0]!.record! : null;
    if (baseCandidates.length > 1) plan.warnings.push(`${label}: ${baseCandidates.length} base rows share this name — treating as full replace`);
    const merged: Rec = { ...target };
    const changes: string[] = [];
    for (const [k, v] of Object.entries(record)) {
      const changed = base ? !same(base[k], v) : !same(target[k], v);
      if (!changed || same(target[k], v)) continue;
      changes.push(`${k}: ${show(target[k])} → ${show(v)}`);
      merged[k] = v;
    }
    merged.recordId = meta.recordId;
    merged.queuedVersion = meta.queuedVersion;
    merged.active = true;
    plan.updates.push({ id, label, record: orderRecord(merged), changes, fullReplace: !base });
  }
  return plan;
}

function report(t: TypeConfig, plan: Plan): void {
  console.log(`\n══ ${t.label} — ${t.existing.length} existing`);
  console.log(`  create ${plan.creates.length} | update ${plan.updates.length} | remove (inactive) ${plan.removes.length} | unchanged ${plan.unchanged.length} | legacy records getting recordId "0": ${plan.legacy.length}`);
  for (const c of plan.creates) console.log(`  + ${c.id.padEnd(48)} ${c.label}`);
  for (const u of plan.updates) {
    console.log(`  ~ ${u.id.padEnd(48)} ${u.label}${u.fullReplace ? "  (no base row — every differing field)" : ""}`);
    if (!u.changes.length) console.log("      (no field changes — metadata only)");
    for (const ch of u.changes) console.log(`      ${ch}`);
  }
  for (const r of plan.removes) console.log(`  - ${r.id.padEnd(48)} ${r.label} → active: false`);
  for (const w of plan.warnings) console.log(`  ! ${w}`);
}

function applyPlan(t: TypeConfig, plan: Plan): void {
  const dir = path.join(ROOT, "seed", "data", "uat", t.dir);
  const file = (id: string) => path.join(dir, `${id}.ts`);
  const exportName = (id: string) => `${t.toCamelCase(id)}${t.exportSuffix}`;

  for (const id of plan.legacy) setMetaInFile(file(id), { recordId: "0", queuedVersion: 0, active: true });
  for (const r of plan.removes) setMetaInFile(file(r.id), { ...r.meta, active: false });
  for (const u of plan.updates) fs.writeFileSync(file(u.id), t.emit(exportName(u.id), u.record));
  for (const c of plan.creates) fs.writeFileSync(file(c.id), t.emit(exportName(c.id), c.record));
  appendToIndex(path.join(dir, "index.ts"), plan.creates.map((c) => ({ exportName: exportName(c.id), fileName: c.id })));
  t.writeTypeFile();
}

/** Every parser module loaded the overlay file separately — union their additions and write once. */
function writeOverlay(): void {
  const merged: Record<string, { name: string; slug: string }[]> = fs.existsSync(OVERLAY_PATH)
    ? JSON.parse(fs.readFileSync(OVERLAY_PATH, "utf8"))
    : {};
  for (const t of TYPES) {
    for (const [key, entries] of Object.entries(t.overlay)) {
      const bucket = merged[key] ?? (merged[key] = []);
      for (const e of entries) if (!bucket.some((b) => b.slug === e.slug)) bucket.push(e);
    }
  }
  fs.writeFileSync(OVERLAY_PATH, JSON.stringify(merged, null, 2) + "\n");
}

function main(): void {
  console.log(`base:     ${path.relative(ROOT, basePath)}\nincoming: ${path.relative(ROOT, incomingPath)}\nmode:     ${apply ? "APPLY" : "dry run (pass --apply to write)"}`);
  const plans = TYPES.map((t) => [t, planType(t)] as const);
  for (const [t, plan] of plans) report(t, plan);
  if (!apply) return;
  for (const [t, plan] of plans) applyPlan(t, plan);
  writeOverlay();
  console.log("\nApplied. Next: npm run export:data-json, then review the JSON diff before seeding.");
}

main();
