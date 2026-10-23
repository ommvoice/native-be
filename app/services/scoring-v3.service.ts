import type { RecommendationV2Candidate } from '../dtos/recommendation.dto';
import { AppClock } from '../shared/utils/app-clock';
import { getWeatherByPostcode } from './weather.service';

/**
 * Scoring for RecommendationV2Service.getItemsWithScoreV2 — kept fully separate from
 * scoring.service.ts (v1) and scoring-v2.service.ts (used by getItemsWithScore), so V2 logic can be
 * changed here without affecting the existing endpoints. Started as a straight copy of the functions
 * getItemsWithScoreV2 used from those two files (same behaviour); nothing here imports from them.
 */

// ── Types ─────────────────────────────────────────────────────────────────────────────────────

/** Per-dimension scores for one candidate. A dimension pre-set to 100 (see getInitialScore) is skipped. */
export interface ScoreV3 {
  intrestScore: number;
  interestTagsScore: number;
  ageScore: number;
  scheduleScore: number;
  weatherScore: number;
  distanceScore: number;
  total: number;
  totalWeighted: number;
}

export interface AgeBandsV3 {
  under1: boolean | null;
  ages1To2: boolean | null;
  ages3To4: boolean | null;
  ages5To7: boolean | null;
  ages8To12: boolean | null;
  over13: boolean | null;
  adults: boolean | null;
}

/** A candidate (as RecommendationV2Repository returns it) plus its V3 scores. */
export interface CandidateWithScoreV3 extends RecommendationV2Candidate {
  score: ScoreV3;
}

export interface SkipScoringV3 {
  skipAll?: boolean;
  skipInterests?: boolean;
  skipIntrestTags?: boolean;
  skipAges?: boolean;
  skipWeather?: boolean;
  skipSchedule?: boolean;
  skipDistance?: boolean;
}

// ── Generic helpers (copied from scoring.service.ts) ─────────────────────────────────────────

export function getAgeInYears(dateOfBirth: Date, asOf = new Date()): number {
  const birth = AppClock.parts(dateOfBirth);
  const ref   = AppClock.parts(asOf);
  let age = ref.year - birth.year;
  const m = ref.month - birth.month;
  if (m < 0 || (m === 0 && ref.day < birth.day)) age--;
  return Math.max(0, age);
}

export function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R     = 3958.7613;
  const toRad = (d: number) => d * (Math.PI / 180);
  const dLat  = toRad(lat2 - lat1);
  const dLon  = toRad(lon2 - lon1);
  const a     =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function metersToMilesOneDecimal(meters: number): number {
  return Math.round(meters * 0.000621371192 * 10) / 10;
}

// ── Initial / skipped scores ──────────────────────────────────────────────────────────────────

export function getInitialScore({
  skipAll,
  skipInterests,
  skipIntrestTags,
  skipAges,
  skipWeather,
  skipSchedule,
  skipDistance,
}: SkipScoringV3): ScoreV3 {
  if (skipAll) {
    return {
      intrestScore: 100,
      interestTagsScore: 100,
      ageScore: 100,
      scheduleScore: 100,
      weatherScore: 100,
      distanceScore: 100,
      total: 100,
      totalWeighted: 100,
    };
  }

  return {
    intrestScore: skipInterests ? 100 : 0,
    interestTagsScore: skipIntrestTags ? 100 : 0,
    ageScore: skipAges ? 100 : 0,
    scheduleScore: skipSchedule ? 100 : 0,
    weatherScore: skipWeather ? 100 : 0,
    distanceScore: skipDistance ? 100 : 0,
    total: 0,
    totalWeighted: 0,
  };
}

// ── Interests ─────────────────────────────────────────────────────────────────────────────────

/** Per-member interest level against one opportunity (0 = no match). */
export const INTEREST_LEVEL = {
  /** Picked the opportunity's interest category AND its theme. */
  categoryAndTheme: 100,
  /** Picked its theme (but not its category). */
  theme: 90,
  /** Picked one of its theme variants. */
  variant: 80,
  /** Picked only its interest category. */
  category: 70,
  none: 0,
} as const;
export type InterestMatchKind = keyof typeof INTEREST_LEVEL;

/** An opportunity is only dropped when this share of family members — or fewer — match it (interest
 * score 0). Anything that matches more members is kept and scored by how many match. */
export const INTEREST_DROP_AT_OR_BELOW_SHARE = 0.1;

/** One family member's interests, as stored: interest categories + picked sub-category slugs (themes,
 * or theme variants if a variant was picked). */
export interface InterestMemberV3 {
  id: string;
  categories: string[];
  picks: string[];
}

/** The opportunity side: its theme(s), variant(s) and the interest categories its theme belongs to. */
export interface OpportunityInterestV3 {
  themes: string[];
  variants: string[];
  categories: string[];
}

const slugList = (raw: string | null | undefined): string[] =>
  (raw ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/**
 * Who counts toward the interest share: the parent plus children/adults — but only members who picked
 * at least one interest, and never same-day guests (variant "guest"), so neither can pull a family
 * into dropping an opportunity.
 */
export function interestMembersOf(family: {
  id: string;
  interestCategories: { slug: string }[];
  interestSubCategories: { slug: string }[];
  children: { id: string; variant?: string | null; interestCategories: { slug: string }[]; interestSubCategories: { slug: string }[] }[];
}): InterestMemberV3[] {
  const toMember = (id: string, cats: { slug: string }[], subs: { slug: string }[]): InterestMemberV3 => ({
    id,
    categories: [...new Set(cats.map((x) => x.slug.trim().toLowerCase()).filter(Boolean))],
    picks: [...new Set(subs.map((x) => x.slug.trim().toLowerCase()).filter(Boolean))],
  });
  return [
    toMember(family.id, family.interestCategories, family.interestSubCategories),
    ...family.children
      .filter((c) => c.variant !== 'guest')
      .map((c) => toMember(c.id, c.interestCategories, c.interestSubCategories)),
  ].filter((m) => m.categories.length > 0 || m.picks.length > 0);
}

/** An opportunity's theme / variants (comma-joined multi-values are split) and the interest categories
 * of its theme(s), looked up in `themeCategories` (theme slug → interest category slugs). */
export function opportunityInterestOf(
  themeSlug: string,
  themeVariantSlug: string,
  themeCategories: Map<string, string[]>,
): OpportunityInterestV3 {
  const themes = slugList(themeSlug);
  return {
    themes,
    variants: slugList(themeVariantSlug),
    categories: [...new Set(themes.flatMap((t) => (themeCategories.get(t) ?? []).map((c) => c.toLowerCase())))],
  };
}

/** One member's best match with the opportunity. */
export function memberInterestMatch(member: InterestMemberV3, opp: OpportunityInterestV3): InterestMatchKind {
  const picks = new Set(member.picks);
  const theme = opp.themes.some((t) => picks.has(t));
  const variant = opp.variants.some((v) => picks.has(v));
  const category = opp.categories.some((c) => member.categories.includes(c));
  if (theme && category) return 'categoryAndTheme';
  if (theme) return 'theme';
  if (variant) return 'variant';
  if (category) return 'category';
  return 'none';
}

export interface InterestMatchV3 {
  /** 0–100; 0 drops the opportunity. 50 (neutral) when no member has interests. */
  score: number;
  /** Matching members ÷ counted members (0–1). */
  share: number;
  members: { id: string; kind: InterestMatchKind; level: number }[];
}

/**
 * Interest score from the family's SHARE of matching members:
 *   - each counted member gets a level: category+theme 100 · theme 90 · variant 80 · category 70 · none 0
 *   - share = members with any match ÷ counted members; 10% or less → 0 (dropped). In a family of
 *     fewer than 10 counted members that means only opportunities nobody matches are dropped.
 *   - otherwise score = average level across counted members — so an interest more members share
 *     scores higher (e.g. 4 of 4 on the theme → 90; 3 of 4 → 67.5; 1 of 4 → 22.5; 0 of 4 → dropped).
 * No counted members (nobody picked interests) → neutral 50 for every opportunity.
 */
export function scoreInterestMatch(members: InterestMemberV3[], opp: OpportunityInterestV3): InterestMatchV3 {
  if (members.length === 0) return { score: 50, share: 0, members: [] };
  const rows = members.map((m) => {
    const kind = memberInterestMatch(m, opp);
    return { id: m.id, kind, level: INTEREST_LEVEL[kind] };
  });
  const share = rows.filter((r) => r.level > 0).length / rows.length;
  const score = share <= INTEREST_DROP_AT_OR_BELOW_SHARE ? 0 : rows.reduce((a, r) => a + r.level, 0) / rows.length;
  return { score, share, members: rows };
}

/** Counts how many children (each deduped against themselves) picked each free-text interestTag —
 * unlike a flat Set this preserves "shared-ness": a tag 2 children both picked outranks one only
 * 1 child picked. Tags are child-only (no parent-level interestTags field, unlike theme slugs). */
export function buildChildTagWeights(childrenTags: string[][]): Map<string, number> {
  const weights = new Map<string, number>();
  for (const tags of childrenTags) {
    for (const t of new Set(tags.map((t) => t.trim().toLowerCase()))) {
      if (!t) continue;
      weights.set(t, (weights.get(t) ?? 0) + 1);
    }
  }
  return weights;
}

/** Interest tags score weighted by how many children share each matched tag (see
 * buildChildTagWeights) — a tag only 1 child picked scores lower than one 2 children both picked,
 * even though both are technically "a match". No child tags selected -> neutral 50. */
export function scoreInterestTagsWeighted(weights: Map<string, number>, candidateTags: string[]): number {
  let totalWeight = 0;
  for (const w of weights.values()) totalWeight += w;
  if (totalWeight === 0) return 50;

  const candidateSet = new Set(candidateTags.map((t) => t.trim().toLowerCase()));
  let matchedWeight = 0;
  for (const [tag, weight] of weights) {
    if (candidateSet.has(tag)) matchedWeight += weight;
  }

  return (matchedWeight / totalWeight) * 100;
}

// ── Age ───────────────────────────────────────────────────────────────────────────────────────

function band(v: boolean | null | undefined): boolean { return v === true; }

function anyBandSelected(b: AgeBandsV3): boolean {
  return band(b.under1) || band(b.ages1To2) || band(b.ages3To4) ||
    band(b.ages5To7) || band(b.ages8To12) || band(b.over13) || band(b.adults);
}

export function childAgeMatchesBands(childAge: number, b: AgeBandsV3): boolean {
  if (!anyBandSelected(b)) return true;
  if (band(b.under1) && childAge < 1) return true;
  if (band(b.ages1To2) && childAge >= 1 && childAge <= 2) return true;
  if (band(b.ages3To4) && childAge >= 3 && childAge <= 4) return true;
  if (band(b.ages5To7) && childAge >= 5 && childAge <= 7) return true;
  if (band(b.ages8To12) && childAge >= 8 && childAge <= 12) return true;
  if (band(b.over13) && childAge >= 13) return true;
  if (band(b.adults) && childAge >= 16) return true;
  return false;
}

export function scoreAge(childAges: number[], bands: AgeBandsV3): number {
  if (childAges.length === 0 || !anyBandSelected(bands)) return 100;
  const sum = childAges.reduce((acc, age) => acc + (childAgeMatchesBands(age, bands) ? 100 : 0), 0);
  return sum / childAges.length;
}

// ── Schedule ──────────────────────────────────────────────────────────────────────────────────

/** `now` and the "HH:MM" `startTime` are compared as UK wall-clock minutes-since-midnight — not by
 * building Date objects via `setHours`, which runs in the Lambda runtime's own zone (UTC), not the UK's. */
function isStartingWithinAnHour(now: Date, startTime?: string | null): boolean {
  if (!startTime) return false;
  const startMins = AppClock.parseTimeToMinutes(startTime);
  if (startMins === null) return false;
  const diff = startMins - AppClock.minutesSinceMidnight(now);
  return diff >= 0 && diff <= 60;
}

/** Whether `now` falls within [startTime, endTime] on the UK wall clock. A missing bound isn't
 * constraining (e.g. no endTime means "no known closing time", not "always closed"). */
function isOpenNow(now: Date, startTime?: string | null, endTime?: string | null): boolean {
  const nowMins = AppClock.minutesSinceMidnight(now);
  if (startTime) {
    const startMins = AppClock.parseTimeToMinutes(startTime);
    if (startMins !== null && nowMins < startMins) return false;
  }
  if (endTime) {
    const endMins = AppClock.parseTimeToMinutes(endTime);
    if (endMins !== null && nowMins > endMins) return false;
  }
  return true;
}

export function scoreSchedule(
  type: string,
  startDate?: string | null,
  endDate?: string | null,
  activeDays?: string[],
  startTime?: string | null,
  endTime?: string | null,
): number {
  if (type === 'route') return 100;

  const now = new Date();
  const today = AppClock.calendarDay(now);

  if (type === 'event') {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const startDay = start ? AppClock.calendarDay(start) : null;
    const endDay = end ? AppClock.calendarDay(end) : null;

    // No date info at all — can't confirm it's actually on today, so don't show it.
    if (!startDay && !endDay) return 0;
    // Hasn't started yet, or already ended — not on today, don't show it.
    if (startDay && startDay > today) return 0;
    if (endDay && endDay < today) return 0;

    // imminent ones (90).
    if (isStartingWithinAnHour(now, startTime)) return 100;
    // Not starting soon, and outside its own time-of-day window — not open right now, don't show it.
    if (!isOpenNow(now, startTime, endTime)) return 0;
    return 90;
  }

  if (type === 'club') {
    // No recurring schedule captured — can't confirm it's open today, don't show it.
    if (!activeDays || activeDays.length === 0) return 0;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[AppClock.weekday(now)]!;
    // Not running today — closed today, don't show it.
    if (!activeDays.includes(todayName)) return 0;

    if (isStartingWithinAnHour(now, startTime)) return 100;
    // Not starting soon, and outside its own time-of-day window — not open right now, don't show it.
    if (!isOpenNow(now, startTime, endTime)) return 0;
    return 90;
  }

  if (type === 'venue') {
    // No recurring schedule captured — can't confirm it's open today, don't show it.
    if (!activeDays || activeDays.length === 0) return 0;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[AppClock.weekday(now)]!;
    // Not open today (e.g. a weekend-only cafe on a Tuesday) — closed today, don't show it.
    if (!activeDays.includes(todayName)) return 0;

    // No time-of-day resolved for today at all — can't confirm it's open, don't show it.
    if (!startTime && !endTime) return 0;
    if (isStartingWithinAnHour(now, startTime)) return 100;
    // Not starting soon, and outside its own opening hours — not open right now, don't show it.
    if (!isOpenNow(now, startTime, endTime)) return 0;
    return 90;
  }

  return 100;
}

// ── Weather ───────────────────────────────────────────────────────────────────────────────────

const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const weatherCache = new Map<string, { expiresAt: number; slugs: string[] }>();

// WeatherAPI.com condition codes grouped into our own WEATHER_SUITABILITY_ENUM slugs — WeatherAPI
// has no matching vocabulary of its own, so this hand-maps its numeric `condition.code` values
// (see https://www.weatherapi.com/docs/weather_conditions.json) into the closest slug.
const SUNNY_CODES = new Set([1000, 1003]);
const OVERCAST_CODES = new Set([1006, 1009, 1030, 1135, 1147]);
const RAIN_CODES = new Set([1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246]);
const SNOW_ICE_CODES = new Set([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264]);
const STORM_CODES = new Set([1087, 1273, 1276, 1279, 1282]);

/** Maps a live WeatherAPI.com reading into our own weatherSuitability slugs (wet_rain, windy,
 * sunshine, snow_ice, overcast, storm_heavy_rain, dry_mild, dry_cold, dry_warm, dry_hot). A single
 * reading can match more than one slug at once — e.g. a sunny 22C afternoon is both "sunshine" and
 * "dry_warm". */
export function mapWeatherToSuitabilitySlugs(weather: {
  condition: { code: number; isWindy: boolean };
  temp_c: number;
}): string[] {
  const slugs: string[] = [];
  const code = weather.condition.code;

  const isSunny = SUNNY_CODES.has(code);
  const isOvercast = OVERCAST_CODES.has(code);

  if (isSunny) slugs.push('sunshine');
  if (isOvercast) slugs.push('overcast');
  if (RAIN_CODES.has(code)) slugs.push('wet_rain');
  if (SNOW_ICE_CODES.has(code)) slugs.push('snow_ice');
  if (STORM_CODES.has(code)) slugs.push('storm_heavy_rain');

  // "Dry & ..." temperature bands only apply when it's actually dry (sunny or overcast, not
  // rain/snow/storm).
  if (isSunny || isOvercast) {
    if (weather.temp_c < 10) slugs.push('dry_cold');
    else if (weather.temp_c < 18) slugs.push('dry_mild');
    else if (weather.temp_c < 25) slugs.push('dry_warm');
    else slugs.push('dry_hot');
  }

  if (weather.condition.isWindy) slugs.push('windy');

  return slugs;
}

/** getWeatherByPostcode results, translated to our weatherSuitability slugs and cached for 10
 * minutes per postcode — avoids hitting weatherapi.com on every single recommendation request for
 * the same family/location. (Own cache, separate from scoring-v2's.) */
export async function getCachedWeatherSuitabilitySlugs(postcode: string): Promise<string[]> {
  const key = postcode.trim().toUpperCase();
  const cached = weatherCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.slugs;

  const weather = await getWeatherByPostcode(postcode);
//     const weather = {
//     "condition": {
//         "text": "Light rain",
//         "icon": "https://cdn.weatherapi.com/weather/64x64/day/296.png",
//         "code": 1183,
//         "isDay": true,
//         "isWindy": false
//     },
//     "wind_mph": 16,
//     "temp_c": 13,
//     "localtime": "2026-10-23 13:00"
// }
  const slugs = mapWeatherToSuitabilitySlugs(weather);
  weatherCache.set(key, { slugs, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
  return slugs;
}

/** Weather that keeps families away from exposed places: "rainy and similar". */
export const BAD_WEATHER_SLUGS: ReadonlySet<string> = new Set(['wet_rain', 'storm_heavy_rain', 'snow_ice']);

/** True when the live weather includes rain, storm/heavy rain or snow/ice. Dry, sunny, overcast and
 * windy on their own are good weather. */
export function isBadWeather(liveWeatherSlugs: string[]): boolean {
  return liveWeatherSlugs.some((s) => BAD_WEATHER_SLUGS.has(s.trim().toLowerCase()));
}

export type WeatherSetting = 'outside' | 'mixed' | 'inside';

/** How exposed an opportunity is: "mixed_covering", or both inside and outside, is mixed. No setting
 * recorded is treated as mixed (shown in bad weather, but lower) rather than guessed either way. */
export function weatherSettingOf(physicalSetting: string[]): WeatherSetting {
  const s = physicalSetting.map((x) => x.trim().toLowerCase());
  const inside = s.includes('inside');
  const outside = s.includes('outside');
  if (s.includes('mixed_covering') || (inside && outside)) return 'mixed';
  if (inside) return 'inside';
  if (outside) return 'outside';
  return 'mixed';
}

/** Weather scores. 0 removes the opportunity (V2 drops weatherScore === 0). */
export const WEATHER_SCORE = {
  good: 10,
  bad: { outside: 0, mixed: 5, inside: 10 },
} as const;

/**
 * Weather score by setting and whether the live weather is bad:
 *
 *                 good weather (dry / sunny / overcast / windy)   bad weather (rain / storm / snow)
 *   outside       10 — shown                                     0  — hidden
 *   mixed         10 — shown                                     5  — shown, scored lower
 *   inside        10 — shown                                     10 — shown
 *
 * The opportunity's own weather-suitability list no longer decides anything: it let outdoor places
 * that list "windy" or "wet_rain" show in the rain, and hid outdoor places in fine weather whenever
 * the reading wasn't on their list (e.g. fog → dry_cold).
 */
export function scoreWeatherSuitability(liveWeatherSlugs: string[], candidatePhysicalSetting: string[]): number {
  if (!isBadWeather(liveWeatherSlugs)) return WEATHER_SCORE.good;
  return WEATHER_SCORE.bad[weatherSettingOf(candidatePhysicalSetting)];
}

// ── Distance ──────────────────────────────────────────────────────────────────────────────────

export function scoreDistance(distanceMiles: number, maxMiles: number): number {
  if (maxMiles <= 0 || distanceMiles >= maxMiles) return 0;
  if (distanceMiles <= 0) return 100;
  return 100 * (1 - distanceMiles / maxMiles);
}

// ── Combine + rank ────────────────────────────────────────────────────────────────────────────

export function combineWeighted(score: ScoreV3): { total: number, totalWeighted: number } {
  const {
    intrestScore,
    interestTagsScore,
    ageScore,
    scheduleScore,
    weatherScore,
    distanceScore,
  } = score;
  const total =
    intrestScore +
    interestTagsScore +
    ageScore +
    scheduleScore +
    weatherScore +
    distanceScore;

  const totalWeighted = Math.round(total / 6);

  return { total, totalWeighted };
}

export function rankWithShuffle<T extends { score: { total: number, totalWeighted: number, interestTagsScore: number } }>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => b.score.total - a.score.total || b.score.interestTagsScore - a.score.interestTagsScore);
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && sorted[j].score === sorted[i].score && sorted[j].score.interestTagsScore === sorted[i].score.interestTagsScore) j++;
    for (let k = j - 1; k > i; k--) {
      const r = i + Math.floor(Math.random() * (k - i + 1));
      [sorted[k], sorted[r]] = [sorted[r], sorted[k]];
    }
    i = j;
  }
  return sorted;
}
