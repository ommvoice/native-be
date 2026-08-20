import type { RecommendationV2AgeBands, Score } from '../dtos/recommendation.dto';
import { AppClock } from '../shared/utils/app-clock';
import { getWeatherByPostcode } from './weather.service';

// ── Copied as-is from scoring.service.ts — unchanged logic, reused here ────────────────────────

export function scoreInterestOverlap(familySlugs: Set<string>, themeSlug: string, variantSlug: string): number {
  const opp = new Set<string>();
  if (themeSlug.trim()) opp.add(themeSlug.trim().toLowerCase());
  if (variantSlug.trim()) opp.add(variantSlug.trim().toLowerCase());
  if (familySlugs.size === 0) return 50;
  let matched = 0;
  for (const s of familySlugs) { if (opp.has(s)) matched++; }
  return (matched / familySlugs.size) * 100;
}

// ── New v2 logic ─────────────────────────────────────────────────────────────────────────────

/** Counts how many family members (parent + each child, each deduped against themselves but not
 * against each other) picked each interest slug — unlike a flat Set this preserves "shared-ness":
 * a slug that the parent and 2 children all picked outranks one only a single person picked. */
export function buildFamilyThemeSlugWeights(input: {
  parentSlugs: string[];
  childrenSlugs: string[][];
}): Map<string, number> {
  const weights = new Map<string, number>();
  const bump = (slug: string) => {
    const key = slug.trim().toLowerCase();
    if (!key) return;
    weights.set(key, (weights.get(key) ?? 0) + 1);
  };

  for (const s of new Set(input.parentSlugs.map((s) => s.trim().toLowerCase()))) bump(s);
  for (const childSlugs of input.childrenSlugs) {
    for (const s of new Set(childSlugs.map((s) => s.trim().toLowerCase()))) bump(s);
  }

  return weights;
}

/** Interest theme score weighted by how many family members share each matched slug (see
 * buildFamilyThemeSlugWeights) — a theme only the parent picked scores lower than one the parent
 * and both children all picked, even though both are technically "a match". */
export function scoreInterestThemeWeighted(weights: Map<string, number>, themeSlug: string, variantSlug: string): number {
  const opp = new Set<string>();
  if (themeSlug.trim()) opp.add(themeSlug.trim().toLowerCase());
  if (variantSlug.trim()) opp.add(variantSlug.trim().toLowerCase());

  let totalWeight = 0;
  for (const w of weights.values()) totalWeight += w;
  if (totalWeight === 0) return 50;

  let matchedWeight = 0;
  for (const slug of opp) matchedWeight += weights.get(slug) ?? 0;

  return (matchedWeight / totalWeight) * 100;
}

/** How many of the children's free-text interestTags (e.g. "Cats", "Dogs") show up in this candidate's own tag list — matched case-insensitively. No child tags selected -> neutral 50, same convention as scoreInterestOverlap. */
export function scoreTagOverlap(childTags: string[], candidateTags: string[]): number {
  if (childTags.length === 0) return 50;
  const candidateSet = new Set(candidateTags.map((t) => t.trim().toLowerCase()));
  let matched = 0;
  for (const t of childTags) {
    if (candidateSet.has(t.trim().toLowerCase())) matched++;
  }
  return (matched / childTags.length) * 100;
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

function band(v: boolean | null | undefined): boolean { return v === true; }

function anyBandSelected(b: RecommendationV2AgeBands): boolean {
  return band(b.under1) || band(b.ages1To2) || band(b.ages3To4) ||
    band(b.ages5To7) || band(b.ages8To12) || band(b.over13) || band(b.adults);
}

export function childAgeMatchesBands(childAge: number, b: RecommendationV2AgeBands): boolean {
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

export function scoreAge(childAges: number[], bands: RecommendationV2AgeBands): number {
  if (childAges.length === 0 || !anyBandSelected(bands)) return 100;
  const sum = childAges.reduce((acc, age) => acc + (childAgeMatchesBands(age, bands) ? 100 : 0), 0);
  return sum / childAges.length;
}

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

// ── Weather ──────────────────────────────────────────────────────────────────────────────────

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
 * the same family/location. */
export async function getCachedWeatherSuitabilitySlugs(postcode: string): Promise<string[]> {
  const key = postcode.trim().toUpperCase();
  const cached = weatherCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.slugs;

  const weather = await getWeatherByPostcode(postcode);
  const slugs = mapWeatherToSuitabilitySlugs(weather);
  weatherCache.set(key, { slugs, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
  return slugs;
}

/**
 * Weather suitability score. "outside" candidates are exposed to the live weather: if it isn't
 * one of their own listed suitable conditions, they're excluded entirely (null) rather than just
 * penalised. "inside"/"mixed_covering" candidates are weather-immune, so they always score well —
 * higher than an "outside" match, since they don't depend on the weather actually holding.
 *
 *   outside  + no match -> null (skip)
 *   outside  + match    -> 5
 *   inside   + no match -> 8
 *   inside   + match    -> 10
 */
export function scoreWeatherSuitability(
  liveWeatherSlugs: string[],
  candidatePhysicalSetting: string[],
  candidateWeatherSuitability: string[],
): number {
  const settings = candidatePhysicalSetting.map((s) => s.trim().toLowerCase());
  const isOutside = settings.includes('outside') && !settings.includes('inside') && !settings.includes('mixed_covering');

  const candidateSet = new Set(candidateWeatherSuitability.map((s) => s.trim().toLowerCase()));
  const matches = liveWeatherSlugs.some((s) => candidateSet.has(s));

  if (isOutside) return matches ? 5 : 0;
  return matches ? 10 : 8;
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

export function scoreDistance(distanceMiles: number, maxMiles: number): number {
  if (maxMiles <= 0 || distanceMiles >= maxMiles) return 0;
  if (distanceMiles <= 0) return 100;
  return 100 * (1 - distanceMiles / maxMiles);
}

export function combineWeighted(score: Score): { total: number, totalWeighted: number } {
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

export function rankWithShuffle<T extends { score: {total: number, totalWeighted:number , interestTagsScore: number}}>(items: T[]): T[] {
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
