import { childMatchesSkillAgeBounds } from "../skills/skillAgeGuidance.js";

/** Weighted components: interests 25%, children skills 25%, age 25%, distance 25%. */
export const RECOMMENDATION_WEIGHTS = {
  interests: 0.25,
  skills: 0.25,
  age: 0.25,
  distance: 0.25,
} as const;

export function parseInterestTagSlugs(interestTags: string | null | undefined): Set<string> {
  const out = new Set<string>();
  if (!interestTags?.trim()) return out;
  for (const part of interestTags.split(/[,;]+/)) {
    const s = part.trim().toLowerCase();
    if (s) out.add(s);
  }
  return out;
}

/** True when `interestTags` contains the slug or `themeSlug` equals it (same token set as interest scoring). */
export function matchesInterestSubCategorySlug(
  interestTags: string | null | undefined,
  themeSlug: string,
  subCategorySlug: string,
): boolean {
  console.log('z1: ', { interestTags, themeSlug, subCategorySlug})
  const want = subCategorySlug.trim().toLowerCase();
  if (!want) return false;
  const tags = parseInterestTagSlugs(interestTags);
  if (tags.has(want)) return true;
  return themeSlug.trim().toLowerCase() === want;
}

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

/**
 * Share of family interest slugs matched by the opportunity (`interestTags` slugs + `themeSlug`).
 * If the family has no interests saved, returns a neutral 50.
 */
export function scoreInterestOverlap(
  familySlugs: Set<string>,
  interestTags: string | null | undefined,
  themeSlug: string,
): number {
  const opp = parseInterestTagSlugs(interestTags);
  opp.add(themeSlug.toLowerCase());
  // console.log('c1 2: ', {familySlugs})
  if (familySlugs.size === 0) return 50;
  // console.log('c1')
  let matched = 0;
  for (const s of familySlugs) {
    if (opp.has(s)) matched++;
  }
  return (matched / familySlugs.size) * 100;
}

/**
 * Skill slugs from all children plus linked interest subcategory slug when present (for opportunity skill areas).
 * Only includes tokens for skills whose `minAge` / `maxAge` fit that child's age (see `childMatchesSkillAgeBounds`).
 */
export function collectChildrenSkillSlugs(input: {
  children: {
    childAgeYears: number;
    skills: {
      slug: string;
      subCategory: { slug: string } | null;
      minAge: number | null;
      maxAge: number | null;
    }[];
  }[];
}): Set<string> {
  const set = new Set<string>();
  for (const ch of input.children) {
    for (const sk of ch.skills) {
      if (!childMatchesSkillAgeBounds(ch.childAgeYears, sk.minAge, sk.maxAge)) continue;
      set.add(sk.slug.toLowerCase());
      if (sk.subCategory?.slug) set.add(sk.subCategory.slug.toLowerCase());
    }
  }
  return set;
}

/**
 * Share of children's skill (and linked subcategory) slugs matched by the opportunity's
 * `skillAreaSlug` / `skillAreaVariant` (events & clubs). Venues/routes pass nulls → empty opp set.
 * If the family has no skills saved, returns a neutral 50. If the opportunity has no skill
 * fields, returns a neutral 50 when the family has skills (nothing to match).
 */
export function scoreSkillOverlap(
  childSkillSlugs: Set<string>,
  skillAreaSlug: string | null | undefined,
  skillAreaVariant: string | null | undefined,
): number {
  const opp = new Set<string>();
  if (skillAreaSlug?.trim()) opp.add(skillAreaSlug.trim().toLowerCase());
  if (skillAreaVariant?.trim()) opp.add(skillAreaVariant.trim().toLowerCase());
  if (childSkillSlugs.size === 0) return 50;
  if (opp.size === 0) return 50;
  let matched = 0;
  for (const s of childSkillSlugs) {
    if (opp.has(s)) matched++;
  }
  return (matched / childSkillSlugs.size) * 100;
}

export function childAgeMatchesSuitabilitySlugs(childAge: number, slugs: string[]): boolean {
  if (!slugs.length) return true;
  if (slugs.includes("age_16_plus") && childAge >= 16) return true;
  if (slugs.includes("age_13_plus") && childAge >= 13) return true;
  if (slugs.includes("under_1") && childAge < 1) return true;
  return slugs.includes(`age_${childAge}`);
}

export function scoreAgeFromSuitabilitySlugs(childAges: number[], slugs: string[]): number {
  if (!slugs.length) return 100;
  let sum = 0;
  for (const age of childAges) {
    sum += childAgeMatchesSuitabilitySlugs(age, slugs) ? 100 : 35;
    // console.log('d1: ', {sum})
  }
  // console.log('b1: ', {sum, childAges })
  return sum / childAges.length;
}

/** Linear distance score (0–100): 100 at 0 mi, 0 at `maxDistanceMiles`. */
export function scoreDistanceLinear(distanceMiles: number, maxDistanceMiles: number): number {
  if (maxDistanceMiles <= 0) return 0;
  if (distanceMiles <= 0) return 100;
  if (distanceMiles >= maxDistanceMiles) return 0;
  return 100 * (1 - distanceMiles / maxDistanceMiles);
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

export function combineWeightedScore(
  interestScore: number,
  skillScore: number,
  ageScore: number,
  distanceScore: number,
): number {
  const total =
    interestScore * RECOMMENDATION_WEIGHTS.interests +
    skillScore * RECOMMENDATION_WEIGHTS.skills +
    ageScore * RECOMMENDATION_WEIGHTS.age +
    distanceScore * RECOMMENDATION_WEIGHTS.distance;
  return Math.round(total);
}

/** Nearby mode: only age + distance; each 50% (interests not used). */
export const NEARBY_WEIGHTS = {
  age: 0.5,
  distance: 0.5,
} as const;

export function combineNearbyScore(ageScore: number, distanceScore: number): number {
  return Math.round(
    ageScore * NEARBY_WEIGHTS.age + distanceScore * NEARBY_WEIGHTS.distance,
  );
}
