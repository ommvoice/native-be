/**
 * Runs RecommendationV2Service.getItemsWithScoreV3 locally against UAT data.
 *
 *   npm run test:recommendationsV3
 *
 * Uses the params.json family with interests/tags/ages/schedule/weather/distance scoring skipped.
 */
import "dotenv/config";
import { TABLES } from "../seed/config/index.js";

// Every table the app reads, as the TABLE_* env vars the Lambdas get from CDK (camelCase key ->
// TABLE_SNAKE_CASE) — derived from TABLES so new tables don't need adding here.
for (const [key, tableName] of Object.entries(TABLES)) {
  process.env[`TABLE_${key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}`] = tableName;
}

import { RecommendationV2Service } from "../app/services/recommendation-v2.service.js";
import { buildChildTagWeights, commonThemesOf, getInitialScore, interestMembersOf, type ScoreV3 } from "../app/services/scoring-v3.service.js";
import params from "../app/shared/assets/params.json" with { type: "json" };
import type { Narrowed } from "../app/shared/types/assets.types.js";

function loadNarrowed(): Narrowed {
  return {
    ...params.narrowedV3,
    children: params.narrowedV3.children.map((c) => ({ ...c, dateOfBirth: new Date(c.dateOfBirth) })),
  } as Narrowed;
}

function skipScore(): ScoreV3 {
  return getInitialScore({
    // skipInterests: false,
    // skipIntrestTags: true,
    // skipAges: true,
    skipWeather: true,
    // skipSchedule: true,
    // skipDistance: true,
  });
}

/** Prints each member's interests (categories), themes (sub-categories) and tags, plus the
 * child interest-tag weights V3 uses for the interestTags score. */
function printFamily(narrowed: Narrowed) {
  const slugs = (xs: { slug: string }[]) => JSON.stringify(xs.map((x) => x.slug));

  console.log("\n---parent---");
  console.log(`interests = ${slugs(narrowed.interestCategories)}`);
  console.log(`themes = ${slugs(narrowed.interestSubCategories)}`);

  narrowed.children.forEach((c, i) => {
    console.log(`\n----child ${i + 1} (${c.id}${c.variant ? `, ${c.variant}` : ""})----`);
    console.log(`interests = ${slugs(c.interestCategories)}`);
    console.log(`themes = ${slugs(c.interestSubCategories)}`);
    console.log(`interestTags = ${JSON.stringify(c.interestTags ?? [])}`);
  });

  console.log("\n----commonThemes (picked by every member)----");
  console.log(JSON.stringify([...commonThemesOf(interestMembersOf(narrowed))]));

  const weights = buildChildTagWeights(narrowed.children.map((c) => c.interestTags ?? []));
  console.log("\n----interestTagsWeightage----");
  if (weights.size === 0) console.log("(no child interest tags)");
  [...weights.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([tag, weight]) => console.log(`${tag} : ${weight}`));
}

type Row = Record<string, any>;
const name = (r: Row) => r.venueName ?? r.eventName ?? r.clubName ?? r.routeName ?? r.name ?? "?";

function printTable(rows: Row[], label: string) {
  const TOP = 20;
  console.log(`\n${label}: ${rows.length} results (showing top ${Math.min(TOP, rows.length)})`);
  console.log("  #   type   score  int tag age sch wth dst  miles  name / id");
  rows.slice(0, TOP).forEach((r, i) => {
    const s = r.scoreBreakdown ?? r.score ?? {};
    const n = (v: unknown) => (typeof v === "number" ? String(Math.round(v)) : String(v ?? "-")).padStart(3);
    console.log(
      `  ${String(i + 1).padStart(2)}  ${String(r.opportunityType ?? r.type).padEnd(5)}  ${String(s.total ?? "-").padStart(5)}  ` +
      `${n(s.intrestScore)} ${n(s.interestTagsScore)} ${n(s.ageScore)} ${n(s.scheduleScore)} ${n(s.weatherScore)} ${n(s.distanceScore)}  ` +
      `${String(r.drivingDistanceMiles ?? r.distanceMiles ?? "-").padStart(5)}  ${name(r)} (${r.id})`,
    );
  });
}

async function main() {
  const narrowed = loadNarrowed();
  const service = new RecommendationV2Service();
  console.log(
    `Family: parent ${narrowed.id} | ${narrowed.postCode} | radius ${narrowed.searchRadius} mi | ` +
    `${narrowed.children.length} children`,
  );

  printFamily(narrowed);

  const t0 = Date.now();
  const v3 = await service.getItemsWithScoreV3(narrowed, skipScore());
  console.log(`getItemsWithScoreV3: ${Date.now() - t0} ms`);

  printTable(v3.data as Row[], "V3");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
