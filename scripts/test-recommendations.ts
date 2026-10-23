/**
 * Runs RecommendationV2Service.getItemsWithScoreV2 locally against UAT data, to try scoring changes
 * before deploying.
 *
 *   npm run test:recommendations                                   # params.json family, top 20
 *   npm run test:recommendations -- --compare                      # also run v1, show what V2 adds/drops
 *   npm run test:recommendations -- --parent-id <id>               # a real parent (+ children) from UAT
 *   npm run test:recommendations -- --skip weather,schedule        # skip scoring dimensions (like ?skipRecommendations)
 *   npm run test:recommendations -- --top 50
 *
 * Opportunities come from whatever AssetsService returns (JSON assets or DynamoDB); parents, children,
 * opportunity-interactions (90-day "Not for us") and driving-leg cache come from the UAT tables.
 * Note: missing driving legs are computed and WRITTEN to the UAT driving-legs cache for this parent.
 * Full results are written to tmp/test-recommendations.json.
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { TABLES } from "../seed/config/index.js";

// Every table the app reads, as the TABLE_* env vars the Lambdas get from CDK (camelCase key ->
// TABLE_SNAKE_CASE) — derived from TABLES so new tables don't need adding here.
for (const [key, tableName] of Object.entries(TABLES)) {
  process.env[`TABLE_${key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}`] = tableName;
}

import { RecommendationV2Service } from "../app/services/recommendation-v2.service.js";
import { RecommendationV2Repository } from "../app/repositories/recommendation-v2.repository.js";
import { getInitialScore } from "../app/services/scoring-v2.service.js";
import params from "../app/shared/assets/params.json" with { type: "json" };
import type { Narrowed } from "../app/shared/types/assets.types.js";
import type { Score } from "../app/dtos/recommendation.dto.js";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
};
const TOP = Number(arg("--top") ?? 20);
const COMPARE = process.argv.includes("--compare");
const OUT = path.join(process.cwd(), "tmp", "test-recommendations.json");

async function loadNarrowed(): Promise<Narrowed> {
  const parentId = arg("--parent-id");
  if (!parentId) {
    return {
      ...params.narrowed,
      children: params.narrowed.children.map((c) => ({ ...c, dateOfBirth: new Date(c.dateOfBirth) })),
    } as Narrowed;
  }
  const parent = await new RecommendationV2Repository().getParentForRecommendations(parentId);
  if (!parent) throw new Error(`Parent ${parentId} not found in ${TABLES.parents}`);
  return parent as unknown as Narrowed;
}

function skipScore(): Score | undefined {
  const raw = arg("--skip");
  if (!raw) return undefined;
  const s = new Set(raw.split(",").map((x) => x.trim()));
  if (s.has("all")) return getInitialScore({ skipAll: true });
  return getInitialScore({
    skipInterests: s.has("interests"), skipIntrestTags: s.has("interestTags"), skipAges: s.has("ages"),
    skipWeather: s.has("weather"), skipSchedule: s.has("schedule"), skipDistance: s.has("distance"),
  });
}

type Row = Record<string, any>;
const ref = (r: Row) => `${r.opportunityType ?? r.type}:${r.id}`;
const name = (r: Row) => r.venueName ?? r.eventName ?? r.clubName ?? r.routeName ?? r.name ?? "?";

function printTable(rows: Row[], label: string) {
  console.log(`\n${label}: ${rows.length} results (showing top ${Math.min(TOP, rows.length)})`);
  console.log("  #   type   score  int tag age sch wth dst  miles  name / id");
  rows.slice(0, TOP).forEach((r, i) => {
    const s = r.scoreBreakdown ?? r.score ?? {};
    const n = (v: unknown) => (typeof v === "number" ? String(Math.round(v)) : String(v ?? "-")).padStart(3);
    console.log(
      `  ${String(i + 1).padStart(2)}  ${String(r.opportunityType ?? r.type).padEnd(5)}  ${String(s.totalWeighted ?? s.total ?? r.score ?? "-").padStart(5)}  ` +
      `${n(s.intrestScore)} ${n(s.interestTagsScore)} ${n(s.ageScore)} ${n(s.scheduleScore)} ${n(s.weatherScore)} ${n(s.distanceScore)}  ` +
      `${String(r.drivingDistanceMiles ?? r.distanceMiles ?? "-").padStart(5)}  ${name(r)} (${r.id})`,
    );
  });
}

async function main() {
  const narrowed = await loadNarrowed();
  const skip = skipScore();
  const service = new RecommendationV2Service();
  console.log(
    `Family: parent ${narrowed.id} | ${narrowed.postCode} | radius ${narrowed.searchRadius} mi | ` +
    `${narrowed.children.length} children | skip: ${arg("--skip") ?? "none"}`,
  );

  const t0 = Date.now();
  const v2 = await service.getItemsWithScoreV2(narrowed, skip);
  console.log(`getItemsWithScoreV2: ${Date.now() - t0} ms`);
  printTable(v2.data as Row[], "V2");

  const output: Record<string, unknown> = { narrowed, skip: arg("--skip") ?? null, v2 };

  if (COMPARE) {
    const t1 = Date.now();
    const v1 = await service.getItemsWithScore(narrowed, skip);
    console.log(`\ngetItemsWithScore (v1): ${Date.now() - t1} ms — ${v1.data.length} results`);
    const a = new Set((v1.data as Row[]).map(ref)), b = new Set((v2.data as Row[]).map(ref));
    const added = [...b].filter((x) => !a.has(x)), dropped = [...a].filter((x) => !b.has(x));
    console.log(`  in V2 only (${added.length}): ${added.join(", ") || "none"}`);
    console.log(`  in v1 only (${dropped.length}): ${dropped.join(", ") || "none"}`);
    output.v1 = v1;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`\nFull JSON: ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
