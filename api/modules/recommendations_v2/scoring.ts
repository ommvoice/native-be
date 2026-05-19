import type { RecommendationV2AgeBands } from "./types.js";

export function collectFamilyInterestSlugs(input: {
  parentCategorySlugs: string[];
  parentSubCategorySlugs: string[];
  children: {
    interestCategorySlugs: string[];
    interestSubCategorySlugs: string[];
  }[];
}): Set<string> {
  const set = new Set<string>();
  // set.add('playgrounds_and_adventure_play');
  for (const s of input.parentCategorySlugs) set.add(s.toLowerCase());
  for (const s of input.parentSubCategorySlugs) set.add(s.toLowerCase());
  for (const ch of input.children) {
    for (const s of ch.interestCategorySlugs) set.add(s.toLowerCase());
    for (const s of ch.interestSubCategorySlugs) set.add(s.toLowerCase());
  }
  return set;
}

/** Great-circle distance in **miles** (WGS84 mean Earth radius). */
export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R_MILES = 3958.7613;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getAgeInYears(dateOfBirth: Date, asOf: Date = new Date()): number {
  let age = asOf.getFullYear() - dateOfBirth.getFullYear();
  const m = asOf.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

function bandOn(v: boolean | null | undefined): boolean {
  return v === true;
}

function anyV2AgeBandSelected(b: RecommendationV2AgeBands): boolean {
  return (
    bandOn(b.under1) ||
    bandOn(b.ages1To2) ||
    bandOn(b.ages3To4) ||
    bandOn(b.ages5To7) ||
    bandOn(b.ages8To12) ||
    bandOn(b.over13) ||
    bandOn(b.adults)
  );
}

/**
 * Whether `childAge` (whole years) falls in any **selected** v2 age band, e.g.
 * `route_age_suitability_under_1_s` … `route_age_suitability_adults` on `OpportunityRouteV2`
 * (same band layout for venue / event / club v2).
 */
export function childAgeMatchesV2AgeBands(childAge: number, b: RecommendationV2AgeBands): boolean {
  if (!anyV2AgeBandSelected(b)) return true;
  if (bandOn(b.under1) && childAge < 1) return true;
  if (bandOn(b.ages1To2) && childAge >= 1 && childAge <= 2) return true;
  if (bandOn(b.ages3To4) && childAge >= 3 && childAge <= 4) return true;
  if (bandOn(b.ages5To7) && childAge >= 5 && childAge <= 7) return true;
  if (bandOn(b.ages8To12) && childAge >= 8 && childAge <= 12) return true;
  if (bandOn(b.over13) && childAge >= 13) return true;
  if (bandOn(b.adults) && childAge >= 16) return true;
  return false;
}

/** 0–100 from v2 boolean age bands vs children’s ages (100 if no band selected = unrestricted). */
export function scoreAgeFromV2AgeBands(childAges: number[], bands: RecommendationV2AgeBands): number {
  if (childAges.length === 0) return 100;
  if (!anyV2AgeBandSelected(bands)) return 100;
  let sum = 0;
  for (const age of childAges) {
    sum += childAgeMatchesV2AgeBands(age, bands) ? 100 : 0;
  }
  return sum / childAges.length;
}

/**
 * Share of family interest slugs matched by the opportunity's **theme** and **theme variant** slugs
 * (resolved from v2 FKs such as `venue_opportunity_theme_id` / `venue_opportunity_theme_variant_id`).
 * If the family has no interests saved, returns a neutral 50.
 */
export function scoreInterestOverlapFromV2ThemeSlugs(
  familySlugs: Set<string>,
  themeSlug: string,
  themeVariantSlug: string,
): number {
  const opp = new Set<string>();
  const theme = themeSlug.trim().toLowerCase();
  if (theme) opp.add(theme);
  const variant = themeVariantSlug.trim().toLowerCase();
  if (variant) opp.add(variant);
  if (familySlugs.size === 0) return 50;
  let matched = 0;
  for (const s of familySlugs) {
    if (opp.has(s)) matched++;
  }
  return (matched / familySlugs.size) * 100;
}

/** Linear distance score (0–100): 100 at 0 mi, 0 at `maxDistanceMiles`. */
export function scoreDistanceLinear(distanceMiles: number, maxDistanceMiles: number): number {
  if (maxDistanceMiles <= 0) return 0;
  if (distanceMiles <= 0) return 100;
  if (distanceMiles >= maxDistanceMiles) return 0;
  return 100 * (1 - distanceMiles / maxDistanceMiles);
}

/** Theme overlap, age bands, and crow-fly distance each contribute one third of the total (skill unused). */
export function combineWeightedScore(
  interestScore: number,
  ageScore: number,
  distanceScore: number,
): number {

  // If any individual score is zero, the total should be zero (e.g. no theme match, age mismatch, or out-of-range distance should exclude the opportunity from recommendations).
  if (interestScore === 0 || ageScore === 0 || distanceScore === 0) {
    return 0;
  }

  return Math.round((interestScore + ageScore + distanceScore) / 3);
}
