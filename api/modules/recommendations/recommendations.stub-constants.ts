import type { RecommendationCandidate } from "./types.js";
import { haversineDistanceMiles } from "./scoring.js";

/** Fixed “today” for deterministic child ages in tests. */
export const STUB_ANCHOR_ISO = "2026-06-15T12:00:00Z";

export function stubDateYearsBeforeAnchor(years: number): Date {
  const d = new Date(STUB_ANCHOR_ISO);
  d.setFullYear(d.getFullYear() - years);
  return d;
}

/** Parent location aligned with HP2 7DB (same as production demo). */
export const STUB_PARENT_LAT = "51.773282";
export const STUB_PARENT_LON = "-0.434612";

/**
 * Generates lat/lon for stub postcodes `ZZ00 1AA` … `ZZ49 1AA`.
 * - Indices 0–7: within a few miles of parent (expect **8** matches when search radius in miles is small).
 * - Indices 8–19: mid ring (~15–22 mi from parent).
 * - Indices 20–49: far (~100+ mi), still inside a very large UK radius.
 */
export function stubLatLonForIndex(i: number): { latitude: number; longitude: number } {
  const baseLat = Number.parseFloat(STUB_PARENT_LAT);
  const baseLon = Number.parseFloat(STUB_PARENT_LON);
  if (i >= 0 && i < 8) {
    return {
      latitude: baseLat + i * 0.002,
      longitude: baseLon + i * 0.0015,
    };
  }
  if (i < 20) {
    return {
      latitude: baseLat + 0.22 + (i - 8) * 0.015,
      longitude: baseLon + 0.05,
    };
  }
  return {
    latitude: 53.48,
    longitude: -2.24,
  };
}

export function stubPostcodeForIndex(i: number): string {
  return `ZZ${String(i).padStart(2, "0")} 1AA`;
}

/**
 * Keys match `normalizeUkPostcode` output for `ZZ00 1AA` … `ZZ49 1AA` (see postcode-coords).
 */
export const STUB_POSTCODE_COORD_MAP: Record<
  string,
  { latitude: number; longitude: number }
> = Object.fromEntries(
  Array.from({ length: 50 }, (_, i) => [stubPostcodeForIndex(i), stubLatLonForIndex(i)]),
);

const recordTypes: RecommendationCandidate["type"][] = ["venue", "event", "club", "route"];

/**
 * 50 synthetic opportunities (rotating `type`). Coordinates match `stubLatLonForIndex` / `STUB_POSTCODE_COORD_MAP`.
 */
export const FIFTY_STUB_CANDIDATES: RecommendationCandidate[] = Array.from(
  { length: 50 },
  (_, i) => {
    const type = recordTypes[i % 4]!;
    const id = `stub-${type}-${String(i).padStart(2, "0")}`;
    const { latitude: latN, longitude: lonN } = stubLatLonForIndex(i);
    const near = i < 8;
    const mid = i >= 8 && i < 20;
    const interestTags = near
      ? "nature_exploration,scenic_walks"
      : mid
        ? "learning_curiosity,animal_encounters"
        : "movement_energy,soft_play";
    const themeSlug = near
      ? "animal_encounters"
      : mid
        ? "nature_and_wildlife_exploration"
        : "a_big_day_out";
    const ageSlugs =
      i % 5 === 0
        ? ["age_2", "age_3"]
        : ["age_5", "age_6", "age_7", "age_8", "age_9"];

    return {
      type,
      id,
      name: `Stub ${type} ${i}`,
      description: null,
      postcode: stubPostcodeForIndex(i),
      latitude: String(latN),
      longitude: String(lonN),
      interestTags,
      themeSlug,
      ageSuitabilitySlugs: ageSlugs,
      skillAreaSlug: null,
      skillAreaVariant: null,
    };
  },
);

/** Parent + one child (age 7): strong overlap with “near” stub interests. */
export function stubParentWithOneChild(overrides?: {
  searchRadius?: number;
  categorySlugs?: string[];
  subCategorySlugs?: { categorySlug: string; subSlug: string }[];
  childAgeYears?: number;
}) {
  const searchRadius = overrides?.searchRadius ?? 500;
  const categorySlugs = overrides?.categorySlugs ?? ["nature_exploration"];
  const subCategorySlugs = overrides?.subCategorySlugs ?? [];
  const childAge = overrides?.childAgeYears ?? 7;

  return {
    id: "stub-parent-1",
    postCode: "HP2 7DB",
    latitude: STUB_PARENT_LAT,
    longitude: STUB_PARENT_LON,
    searchRadius,
    interestCategories: categorySlugs.map((slug) => ({ slug })),
    interestSubCategories: subCategorySlugs.map((s) => ({ slug: s.subSlug })),
    children: [
      {
        id: "stub-child-1",
        dateOfBirth: stubDateYearsBeforeAnchor(childAge),
        interestCategories: [{ slug: "learning_curiosity" }],
        interestSubCategories: [{ slug: "animal_encounters" }],
        skills: [],
      },
    ],
  };
}

/** Two children: toddler + school age (for `childId` filtering tests). */
export function stubParentWithTwoChildren() {
  return {
    id: "stub-parent-2",
    postCode: "HP2 7DB",
    latitude: STUB_PARENT_LAT,
    longitude: STUB_PARENT_LON,
    searchRadius: 500,
    interestCategories: [{ slug: "nature_exploration" }],
    interestSubCategories: [{ slug: "nature_wildlife" }],
    children: [
      {
        id: "stub-child-toddler",
        dateOfBirth: stubDateYearsBeforeAnchor(2),
        interestCategories: [{ slug: "movement_energy" }],
        interestSubCategories: [{ slug: "soft_play" }],
        skills: [],
      },
      {
        id: "stub-child-school",
        dateOfBirth: stubDateYearsBeforeAnchor(8),
        interestCategories: [{ slug: "learning_curiosity" }],
        interestSubCategories: [{ slug: "animal_encounters" }],
        skills: [],
      },
    ],
  };
}

/** How many stub indices lie within `radiusMiles` of the parent (same geometry as the map). */
export function countStubIndicesWithinMiles(radiusMiles: number): number {
  const lat = Number.parseFloat(STUB_PARENT_LAT);
  const lon = Number.parseFloat(STUB_PARENT_LON);
  let n = 0;
  for (let i = 0; i < 50; i++) {
    const c = stubLatLonForIndex(i);
    const d = haversineDistanceMiles(lat, lon, c.latitude, c.longitude);
    if (d <= radiusMiles) n++;
  }
  return n;
}

/** Deliberately no row coordinates (excluded from scoring / driving routable set). */
export const STUB_UNRESOLVABLE_POSTCODES = [
  "QX00 1AA",
  "QX01 1AA",
  "QX02 1AA",
  "QX03 1AA",
  "QX04 1AA",
] as const;

export const FIVE_STUB_CANDIDATES_NO_COORDS: RecommendationCandidate[] =
  STUB_UNRESOLVABLE_POSTCODES.map((postcode, i) => ({
    type: "venue",
    id: `stub-no-coord-${i}`,
    name: `Stub no coord ${i}`,
    description: null,
    postcode,
    latitude: null,
    longitude: null,
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: ["age_5", "age_6", "age_7"],
    skillAreaSlug: null,
    skillAreaVariant: null,
  }));

/** 50 resolvable + 5 without coordinates (55 rows for repository mocks). */
export const FIFTY_FIVE_STUB_CANDIDATES: RecommendationCandidate[] = [
  ...FIFTY_STUB_CANDIDATES,
  ...FIVE_STUB_CANDIDATES_NO_COORDS,
];
