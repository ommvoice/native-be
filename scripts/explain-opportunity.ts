/**
 * Explains, step by step, how ONE opportunity scores in getItemsWithScoreV2 — what each step looked
 * at, the score it gave, and whether that step drops the opportunity (and why).
 *
 * Edit CONFIG below, then run:   npm run explain:opportunity
 *
 * Everything that changes the outcome is in CONFIG: which opportunity, mocked time/date/day, mocked
 * weather, the family (ages, interests, tags, location) and skipped scoring steps. Leave a value as
 * null/[] to use the real one (current time, live weather, params.json family, …).
 *
 * Read-only: reads JSON assets + (with parentId) UAT parents/children/interactions/driving-legs cache.
 * Distance uses the parent's cached driving distance when there is one, otherwise straight-line —
 * the same rule getItemsWithScoreV2 applies (it would compute + cache missing legs; this script doesn't).
 */
import "dotenv/config";
import { TABLES } from "../seed/config/index.js";

for (const [key, tableName] of Object.entries(TABLES)) {
  process.env[`TABLE_${key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}`] = tableName;
}

import * as ScoringV3 from "../app/services/scoring-v3.service.js";
import { AppClock } from "../app/shared/utils/app-clock.js";
import { AssetsService } from "../app/services/assets.service.js";
import {
  RecommendationV2Repository,
  DEFAULT_CANDIDATE_FILTER,
  filterOpportunityRecords,
} from "../app/repositories/recommendation-v2.repository.js";
import { DrivingLegRepository, legKey } from "../app/repositories/driving-leg.repository.js";
import { OpportunityInteractionRepository, isSuppressed } from "../app/repositories/opportunity-interaction.repository.js";
import params from "../app/shared/assets/params.json" with { type: "json" };
import type { RecommendationV2Candidate } from "../app/dtos/recommendation.dto.js";

// ── CONFIG — edit these, then `npm run explain:opportunity` ───────────────────────────────────

const CONFIG = {
  /** Opportunity id from the JSON assets (venues/events/clubs/routes.json). */
  id: "tenpin_bowling",
  /** Only needed when the id exists in more than one type (e.g. mincing_lake_valley_park). */
  type: null as RecommendationV2Candidate["type"] | null,

  // ── Time (UK wall clock). null = real current time. `day` moves to the next such weekday. ──
  date: "2026-10-24" as string | null,        // "YYYY-MM-DD"
  time: "15:00" as string | null,             // "HH:MM"
  day: null as string | null,                 // "monday" … "sunday"

  // ── Weather. Use EITHER slugs, OR a WeatherAPI condition code + temp. Both null = live weather. ──
  weatherSlugs: ["wet_rain", "windy"] as string[] | null, // sunshine, overcast, wet_rain, snow_ice, storm_heavy_rain, windy, dry_cold, dry_mild, dry_warm, dry_hot
  weatherCode: null as number | null,         // e.g. 1183 (light rain), 1000 (sunny)
  weatherTempC: 15,
  weatherWindy: false,

  // ── Family. parentId = load a real UAT family (also checks its "Not for us" + driving cache). ──
  //    null = params.json family. Anything below that's set overrides that family.
  parentId: null as string | null,
  childAges: null as number[] | null,         // e.g. [4, 9] — replaces the children
  parentInterests: null as string[] | null,   // theme / theme-variant slugs, e.g. ["beaches", "rockpooling"]
  childInterests: null as string[] | null,    // applied to every child
  childTags: null as string[] | null,         // free-text tags, applied to every child, e.g. ["crabbing"]
  postcode: null as string | null,
  latitude: null as string | null,
  longitude: null as string | null,
  radiusMiles: null as number | null,

  // ── Skip scoring steps (treated as 100): "interests", "interestTags", "ages", "schedule", "weather", "distance", or "all". ──
  skip: [] as string[],
};

// ── Mock time ("now" as UK wall-clock) — swaps the global Date so AppClock, schedule scoring and the
//    repository's "today's opening times" all see the same instant. ──────────────────────────────

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function londonOffsetMinutes(utcMs: number): number {
  const name = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "shortOffset" })
    .formatToParts(new Date(utcMs)).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-]\d+)?(?::(\d+))?/.exec(name);
  return m && m[1] ? Number(m[1]) * 60 + Math.sign(Number(m[1])) * Number(m[2] ?? 0) : 0;
}

/** "YYYY-MM-DD" + "HH:MM" interpreted as Europe/London wall time -> epoch ms. */
function londonWallTimeToUtc(date: string, time: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y!, mo! - 1, d!, h!, mi!);
  let utc = guess - londonOffsetMinutes(guess) * 60_000;
  utc = guess - londonOffsetMinutes(utc) * 60_000; // settle across a DST boundary
  return utc;
}

function resolveMockNow(): number | null {
  let date = CONFIG.date ?? undefined;
  let time = CONFIG.time ?? undefined;
  const day = CONFIG.day?.toLowerCase();
  if (!date && !time && !day) return null;

  const today = AppClock.parts(new Date());
  date ??= `${today.year}-${String(today.month + 1).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;
  time ??= AppClock.timeString(new Date()).slice(0, 5);
  let utc = londonWallTimeToUtc(date, time);
  if (day) {
    const target = DAYS.indexOf(day);
    if (target === -1) throw new Error(`CONFIG.day must be one of ${DAYS.join(", ")}`);
    const shift = (target - AppClock.weekday(new Date(utc)) + 7) % 7; // next such day (today if it matches)
    const d = new Date(utc + shift * 86_400_000);
    const p = AppClock.parts(d);
    utc = londonWallTimeToUtc(`${p.year}-${p.month + 1}-${p.day}`, time);
  }
  return utc;
}

function installMockDate(fixedMs: number) {
  const RealDate = Date;
  class MockDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) super(fixedMs);
      else super(...(args as [any]));
    }
    static now() { return fixedMs; }
  }
  (globalThis as any).Date = MockDate;
}

// ── Family (narrowed) ─────────────────────────────────────────────────────────────────────────

interface Child { id: string; dateOfBirth: Date; interestSubCategories: { slug: string }[]; interestTags: string[] }
interface Family { id: string; postCode: string; latitude: string; longitude: string; searchRadius: number; interestSubCategories: { slug: string }[]; children: Child[] }

function birthDateForAge(age: number): Date {
  const now = AppClock.parts(new Date());
  // a day before the age-th birthday's anniversary → exactly `age` years old today
  return new Date(Date.UTC(now.year - age, now.month, now.day) - 86_400_000);
}

async function loadFamily(): Promise<{ family: Family; source: string }> {
  const parentId = CONFIG.parentId;
  let family: Family;
  let source: string;
  if (parentId) {
    const p = await new RecommendationV2Repository().getParentForRecommendations(parentId);
    if (!p) throw new Error(`Parent ${parentId} not found in ${TABLES.parents}`);
    family = p as unknown as Family;
    source = `UAT parent ${parentId}`;
  } else {
    family = { ...(params.narrowed as any), children: params.narrowed.children.map((c: any) => ({ ...c, dateOfBirth: new Date(c.dateOfBirth) })) };
    source = "params.json";
  }

  const ages = CONFIG.childAges;
  if (ages) {
    family.children = ages.map((age, i) => ({
      id: `mock-child-${i + 1}`,
      dateOfBirth: birthDateForAge(age),
      interestSubCategories: family.children[i]?.interestSubCategories ?? [],
      interestTags: family.children[i]?.interestTags ?? [],
    }));
    source += " (ages mocked)";
  }
  const interests = CONFIG.parentInterests;
  if (interests) family.interestSubCategories = interests.map((slug) => ({ slug }));
  const childInterests = CONFIG.childInterests;
  if (childInterests) family.children.forEach((c) => (c.interestSubCategories = childInterests.map((slug) => ({ slug }))));
  const tags = CONFIG.childTags;
  if (tags) family.children.forEach((c) => (c.interestTags = tags));
  if (CONFIG.postcode) family.postCode = CONFIG.postcode;
  if (CONFIG.latitude) family.latitude = CONFIG.latitude;
  if (CONFIG.longitude) family.longitude = CONFIG.longitude;
  if (CONFIG.radiusMiles) family.searchRadius = CONFIG.radiusMiles;
  return { family, source };
}

async function resolveWeather(postcode: string): Promise<{ slugs: string[]; source: string }> {
  if (CONFIG.weatherSlugs) return { slugs: CONFIG.weatherSlugs, source: "mocked (CONFIG.weatherSlugs)" };
  if (CONFIG.weatherCode !== null) {
    const temp = CONFIG.weatherTempC;
    return {
      slugs: ScoringV3.mapWeatherToSuitabilitySlugs({ condition: { code: CONFIG.weatherCode, isWindy: CONFIG.weatherWindy }, temp_c: temp }),
      source: `mocked (WeatherAPI code ${CONFIG.weatherCode}, ${temp}°C${CONFIG.weatherWindy ? ", windy" : ""})`,
    };
  }
  return { slugs: await ScoringV3.getCachedWeatherSuitabilitySlugs(postcode), source: `live weatherapi.com for ${postcode}` };
}

function skipScore(): ScoringV3.ScoreV3 {
  const s = new Set(CONFIG.skip);
  if (s.has("all")) return ScoringV3.getInitialScore({ skipAll: true });
  return ScoringV3.getInitialScore({
    skipInterests: s.has("interests"), skipIntrestTags: s.has("interestTags"), skipAges: s.has("ages"),
    skipWeather: s.has("weather"), skipSchedule: s.has("schedule"), skipDistance: s.has("distance"),
  });
}

// ── Step-by-step evaluation (mirrors getItemsWithScoreV2) ─────────────────────────────────────

interface Ctx {
  family: Family;
  childAges: number[];
  interestMembers: ScoringV3.InterestMemberV3[];
  themeCategories: Map<string, string[]>;
  tagWeights: Map<string, number>;
  weatherSlugs: string[];
  initial: ScoringV3.ScoreV3;
  lat: number;
  lon: number;
  drivingMeters: Map<string, number>;
}

interface Step { name: string; score: number; dropped: boolean; why: string[] }
interface Trace { steps: Step[]; score: ScoringV3.ScoreV3; survived: boolean; distanceMiles?: number }

const r1 = (n: number) => Math.round(n * 10) / 10;
const skipped = (v: number) => v === 100;

function scheduleReason(c: RecommendationV2Candidate, score: number): string {
  const now = new Date();
  const today = DAYS[AppClock.weekday(now)];
  const nowTxt = `now ${AppClock.timeString(now).slice(0, 5)} ${today}`;
  const window = `today's times ${c.startTime ?? "?"}–${c.endTime ?? "?"}`;
  if (c.type === "route") return "routes are always available → 100";
  if (c.type === "event") {
    const range = `${c.startDate?.slice(0, 10) ?? "?"} → ${c.endDate?.slice(0, 10) ?? "?"}`;
    if (!c.startDate && !c.endDate) return "event has no start/end date → can't confirm it's on → 0";
    if (score === 0) return `event dates ${range}, ${window}, ${nowTxt}: not on today, or outside its hours → 0`;
    return `event dates ${range} include today; ${window}, ${nowTxt} → ${score === 100 ? "starts within the hour (100)" : "running now (90)"}`;
  }
  const days = c.activeDays?.length ? c.activeDays.join(", ") : "none";
  if (!c.activeDays?.length) return `no active days recorded → can't confirm it's open → 0`;
  if (!c.activeDays.includes(today!)) return `open days [${days}] don't include ${today} → 0`;
  if (c.type === "venue" && !c.startTime && !c.endTime) return `open ${today}, but no opening times recorded for today → 0`;
  if (score === 0) return `${window}, ${nowTxt}: closed right now → 0`;
  return `open days [${days}] include ${today}; ${window}, ${nowTxt} → ${score === 100 ? "opens within the hour (100)" : "open now (90)"}`;
}

function evaluate(c: RecommendationV2Candidate, ctx: Ctx): Trace {
  const steps: Step[] = [];
  const score: ScoringV3.ScoreV3 = { ...ctx.initial };
  const push = (name: string, value: number, dropped: boolean, why: string[]) => {
    steps.push({ name, score: value, dropped, why });
    return dropped;
  };

  // 1. Interest (share of family members)
  {
    const opp = ScoringV3.opportunityInterestOf(c.themeSlug, c.themeVariantSlug, ctx.themeCategories);
    const r = ScoringV3.scoreInterestMatch(ctx.interestMembers, opp);
    score.intrestScore = skipped(ctx.initial.intrestScore) ? 100 : r.score;
    const why = skipped(ctx.initial.intrestScore)
      ? ["skipped (CONFIG.skip interests) → 100"]
      : ctx.interestMembers.length === 0
        ? ["no family member has interests → neutral 50"]
        : [
            `opportunity: theme ${opp.themes.join(", ") || "-"} | variants ${opp.variants.join(", ") || "-"} | categories ${opp.categories.join(", ") || "-"}`,
            ...r.members.map((m) => `  ${m.id === ctx.family.id ? "parent" : `member ${m.id}`}: ${m.kind} → ${m.level}`),
            `share ${Math.round(r.share * 100)}% of ${r.members.length} members` +
              (r.share <= ScoringV3.INTEREST_DROP_AT_OR_BELOW_SHARE ? ` ≤ 10% → 0 (dropped)` : ` > 10% → average ${r1(r.score)}`),
          ];
    if (push("1 Interest", score.intrestScore, score.intrestScore === 0, why)) return { steps, score, survived: false };
  }

  // 2. Interest tags (V2 filters this step on intrestScore, so tags can never drop anything)
  {
    const total = [...ctx.tagWeights.values()].reduce((a, b) => a + b, 0);
    const candSet = new Set(c.tags.map((t) => t.trim().toLowerCase()));
    const matched = [...ctx.tagWeights.keys()].filter((t) => candSet.has(t));
    score.interestTagsScore = skipped(ctx.initial.interestTagsScore) ? 100 : ScoringV3.scoreInterestTagsWeighted(ctx.tagWeights, c.tags);
    const why = skipped(ctx.initial.interestTagsScore)
      ? ["skipped (CONFIG.skip interestTags) → 100"]
      : total === 0
        ? ["children have no interest tags → neutral 50"]
        : [
            `children's tags: ${[...ctx.tagWeights].map(([k, w]) => `${k}×${w}`).join(", ")}`,
            `opportunity tags (${c.tags.length}): ${c.tags.slice(0, 12).join(", ")}${c.tags.length > 12 ? " …" : ""}`,
            matched.length ? `matched ${matched.join(", ")} → ${r1(score.interestTagsScore)}` : "no tag overlap → 0",
          ];
    why.push("never drops: V2 re-checks intrestScore here, not interestTagsScore");
    push("2 Interest tags", score.interestTagsScore, false, why);
  }

  // 3. Age
  {
    const b = c.ageBands;
    const selected = Object.entries(b).filter(([, v]) => v === true).map(([k]) => k);
    score.ageScore = skipped(ctx.initial.ageScore) ? 100 : ScoringV3.scoreAge(ctx.childAges, b);
    const why = skipped(ctx.initial.ageScore)
      ? ["skipped (CONFIG.skip ages) → 100"]
      : !selected.length
        ? ["opportunity has no age bands set → suits everyone → 100"]
        : [
            `opportunity age bands: ${selected.join(", ")}`,
            `children: ${ctx.childAges.map((a) => `${a}y ${ScoringV3.childAgeMatchesBands(a, b) ? "✓" : "✗"}`).join(", ") || "none"} → average ${r1(score.ageScore)}`,
          ];
    if (push("3 Age", score.ageScore, score.ageScore === 0, why)) return { steps, score, survived: false };
  }

  // 4. Schedule
  {
    score.scheduleScore = skipped(ctx.initial.scheduleScore) ? 100
      : ScoringV3.scoreSchedule(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime);
    const why = skipped(ctx.initial.scheduleScore) ? ["skipped (CONFIG.skip schedule) → 100"] : [scheduleReason(c, score.scheduleScore)];
    if (push("4 Schedule", score.scheduleScore, score.scheduleScore === 0, why)) return { steps, score, survived: false };
  }

  // 5. Weather
  {
    const setting = ScoringV3.weatherSettingOf(c.physicalSetting);
    const bad = ScoringV3.isBadWeather(ctx.weatherSlugs);
    score.weatherScore = skipped(ctx.initial.weatherScore) ? 100 : ScoringV3.scoreWeatherSuitability(ctx.weatherSlugs, c.physicalSetting);
    const why = skipped(ctx.initial.weatherScore)
      ? ["skipped (CONFIG.skip weather) → 100"]
      : [
          `weather now: ${ctx.weatherSlugs.join(", ") || "none"} → ${bad ? "BAD (rain / storm / snow)" : "good"}`,
          `setting: ${c.physicalSetting.join(", ") || "not recorded"} → ${setting}`,
          !bad
            ? "good weather shows everything → 10"
            : setting === "outside" ? "bad weather + outside → 0 (hidden)"
            : setting === "mixed" ? "bad weather + mixed → 5 (shown, scored lower)"
            : "bad weather + inside → 10",
        ];
    if (push("5 Weather", score.weatherScore, score.weatherScore === 0, why)) return { steps, score, survived: false };
  }

  // 6. Distance
  let distMiles: number | undefined;
  {
    const lat = Number.parseFloat(c.latitude ?? ""), lon = Number.parseFloat(c.longitude ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      push("6 Distance", 0, true, ["opportunity has no valid latitude/longitude → dropped"]);
      return { steps, score, survived: false };
    }
    const straight = ScoringV3.haversineDistanceMiles(ctx.lat, ctx.lon, lat, lon);
    const meters = ctx.drivingMeters.get(legKey(c.type, c.id));
    distMiles = meters !== undefined ? ScoringV3.metersToMilesOneDecimal(meters) : straight;
    const max = ctx.family.searchRadius;
    score.distanceScore = skipped(ctx.initial.distanceScore) ? 100 : ScoringV3.scoreDistance(distMiles, max);
    const why = skipped(ctx.initial.distanceScore)
      ? ["skipped (CONFIG.skip distance) → 100"]
      : [
          `${meters !== undefined ? `driving ${r1(distMiles)} mi (cached)` : `straight-line ${r1(straight)} mi (no cached driving distance)`}, radius ${max} mi`,
          distMiles >= max ? `${r1(distMiles)} ≥ ${max} → outside radius → 0` : `100 × (1 − ${r1(distMiles)}/${max}) = ${r1(score.distanceScore)}`,
        ];
    if (push("6 Distance", score.distanceScore, score.distanceScore === 0, why)) return { steps, score, survived: false, distanceMiles: distMiles };
  }

  // 7. Combine
  const { total, totalWeighted } = ScoringV3.combineWeighted(score);
  score.total = total;
  score.totalWeighted = totalWeighted;
  push("7 Final", totalWeighted, totalWeighted === 0, [
    `(${[score.intrestScore, score.interestTagsScore, score.ageScore, score.scheduleScore, score.weatherScore, score.distanceScore].map(r1).join(" + ")}) / 6 = ${r1(total / 6)} → ${totalWeighted}`,
  ]);
  return { steps, score, survived: totalWeighted !== 0, distanceMiles: distMiles };
}

// ── Main ──────────────────────────────────────────────────────────────────────────────────────

async function main() {
  const mockNow = resolveMockNow();
  if (mockNow !== null) installMockDate(mockNow);
  const now = new Date();

  const { family, source } = await loadFamily();
  const assets = new AssetsService();
  const raw = {
    venue: await assets.getAllVenues(), event: await assets.getAllEvents(),
    club: await assets.getAllClubs(), route: await assets.getAllRoutes(),
  } as Record<RecommendationV2Candidate["type"], any[]>;

  const matches = (Object.keys(raw) as RecommendationV2Candidate["type"][])
    .flatMap((type) => raw[type].filter((r) => r.id === CONFIG.id).map((r) => ({ type, record: r })))
    .filter((m) => !CONFIG.type || m.type === CONFIG.type);
  if (matches.length === 0) throw new Error(`No ${CONFIG.type ?? "opportunity"} with id "${CONFIG.id}" in the JSON assets`);
  if (matches.length > 1) throw new Error(`"${CONFIG.id}" exists as ${matches.map((m) => m.type).join(" and ")} — set CONFIG.type`);
  const { type, record } = matches[0]!;

  const weather = await resolveWeather(family.postCode);
  const parentId = CONFIG.parentId;

  const drivingMeters = new Map<string, number>();
  if (parentId) {
    for (const leg of await new DrivingLegRepository().findByParentId(parentId)) {
      if (typeof (leg as any).drivingDistanceMeters === "number") drivingMeters.set(leg.typeId, (leg as any).drivingDistanceMeters);
    }
  }

  const ctx: Ctx = {
    family,
    childAges: family.children.map((c) => ScoringV3.getAgeInYears(c.dateOfBirth)),
    interestMembers: ScoringV3.interestMembersOf(family as any),
    themeCategories: new Map(new AssetsService().getThemes().map((t) => [t.slug.toLowerCase(), t.interestId as string[]])),
    tagWeights: ScoringV3.buildChildTagWeights(family.children.map((ch) => ch.interestTags ?? [])),
    weatherSlugs: weather.slugs,
    initial: skipScore(),
    lat: Number.parseFloat(family.latitude),
    lon: Number.parseFloat(family.longitude),
    drivingMeters,
  };

  const name = record.venueName ?? record.eventName ?? record.clubName ?? record.routeName;
  console.log(`\n${name} — ${type}:${CONFIG.id}  (recordId ${record.recordId ?? "-"}, v${record.queuedVersion ?? "-"}, active ${record.active ?? true})`);
  console.log(`now:     ${AppClock.dateTimeString(now)} (${DAYS[AppClock.weekday(now)]})${mockNow !== null ? "  [mocked]" : ""}`);
  console.log(`weather: ${weather.slugs.join(", ") || "none"}  [${weather.source}]`);
  console.log(`family:  ${source} | ${family.postCode} | radius ${family.searchRadius} mi | children ages ${ctx.childAges.join(", ") || "none"}`);
  console.log(`         interests: ${family.interestSubCategories.map((x) => x.slug).join(", ") || "none"} | child tags: ${[...ctx.tagWeights.keys()].join(", ") || "none"}`);

  // 0. Candidate filter + "Not for us" — before any scoring
  console.log(`\n0 Candidate filter`);
  const passesFilter = filterOpportunityRecords([record], DEFAULT_CANDIDATE_FILTER).length === 1;
  const filterWhy = record.active === false ? "active: false (REMOVE request)"
    : !(DEFAULT_CANDIDATE_FILTER.versions ?? []).includes(record.queuedVersion ?? 0) ? `queuedVersion ${record.queuedVersion} not in versions [${DEFAULT_CANDIDATE_FILTER.versions}]`
    : "removed by id";
  console.log(`   ${passesFilter ? "✓ passes" : `✗ DROPPED — ${filterWhy}`} (filter: ${JSON.stringify(DEFAULT_CANDIDATE_FILTER)})`);
  let suppressedNote = "not checked (set CONFIG.parentId to check this family's \"Not for us\")";
  if (parentId) {
    const inter = (await new OpportunityInteractionRepository().listByParentId(parentId))
      .find((i: any) => i.opportunityType === type && i.opportunityId === CONFIG.id);
    suppressedNote = inter && isSuppressed(inter) ? `✗ DROPPED — marked "Not for us" (hidden for 90 days)` : "✓ not hidden by \"Not for us\"";
  }
  console.log(`   ${suppressedNote}`);

  // Steps 1–7 (run even if step 0 dropped it, so you can see how it WOULD score)
  const all = await new RecommendationV2Repository().getOpportunityCandidatesV2({ includeInactive: true });
  const candidate = all.find((c) => c.type === type && c.id === CONFIG.id)!;
  const trace = evaluate(candidate, ctx);
  for (const s of trace.steps) {
    console.log(`\n${s.name}: ${typeof s.score === "number" ? r1(s.score) : s.score}${s.dropped ? "   ✗ DROPPED HERE" : "   ✓"}`);
    for (const w of s.why) console.log(`   ${w}`);
  }

  // Rank among everything that survives with the same mocks
  const survivors = (await new RecommendationV2Repository().getOpportunityCandidatesV2())
    .map((c) => ({ c, t: evaluate(c, ctx) }))
    .filter(({ t }) => t.survived)
    .map(({ c, t }) => ({ id: `${c.type}:${c.id}`, score: t.score }));
  const ranked = ScoringV3.rankWithShuffle(survivors);
  const pos = ranked.findIndex((x) => x.id === `${type}:${CONFIG.id}`);
  console.log(`\nResult: ${!passesFilter ? "NOT SHOWN (candidate filter)" : trace.survived ? `shown — rank ${pos + 1} of ${ranked.length}` : "NOT SHOWN (dropped at a scoring step)"}`);
  if (pos > 0) {
    const above = ranked.slice(Math.max(0, pos - 3), pos).map((x) => `${x.id} (${x.score.totalWeighted})`);
    console.log(`   just above it: ${above.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
