/**
 * Test doubles and fixtures used only by `tests/*`.
 * Keeps this suite independent of `../recommendations.repository.stubs.ts`.
 */
import { vi } from "vitest";
import { legKey } from "../driving-leg.repository.js";
import { stubOpportunityPayloadFromCandidate } from "../recommendation-stub-payload.js";
import type { RecommendationsRepository } from "../repository.js";
import type { RecommendationCandidate } from "../types.js";

export const STUB_TIME_ANCHOR_ISO = "2026-06-15T12:00:00Z";

const STUB_PARENT_LAT = "51.773282";
const STUB_PARENT_LON = "-0.434612";

export function yearsBeforeFromAnchor(isoDate: string, years: number): Date {
  const d = new Date(isoDate);
  d.setFullYear(d.getFullYear() - years);
  return d;
}

/** Minimal parent row shape used by `RecommendationsService` (matches Prisma include). */
export type StubParentRow = {
  id: string;
  postCode: string;
  latitude: string;
  longitude: string;
  searchRadius: number;
  interestCategories: { slug: string }[];
  interestSubCategories: { slug: string }[];
  children: {
    id?: string;
    dateOfBirth: Date;
    interestCategories: { slug: string }[];
    interestSubCategories: { slug: string }[];
    skills: {
      slug: string;
      minAge: number | null;
      maxAge: number | null;
      subCategory: { slug: string } | null;
    }[];
  }[];
};

export function stubParentNatureChildAge7(
  overrides?: Partial<Pick<StubParentRow, "id" | "searchRadius">>,
): StubParentRow {
  return {
    id: overrides?.id ?? "p1",
    postCode: "HP2 7DB",
    latitude: STUB_PARENT_LAT,
    longitude: STUB_PARENT_LON,
    searchRadius: overrides?.searchRadius ?? 500,
    interestCategories: [{ slug: "nature_exploration" }],
    interestSubCategories: [],
    children: [
      {
        id: "stub-nature-child-7",
        dateOfBirth: yearsBeforeFromAnchor(STUB_TIME_ANCHOR_ISO, 7),
        interestCategories: [],
        interestSubCategories: [],
        skills: [],
      },
    ],
  };
}

export function stubParentLearningCuriosityChildAge7(
  overrides?: Partial<Pick<StubParentRow, "id" | "searchRadius">>,
): StubParentRow {
  return {
    id: overrides?.id ?? "p1",
    postCode: "HP2 7DB",
    latitude: STUB_PARENT_LAT,
    longitude: STUB_PARENT_LON,
    searchRadius: overrides?.searchRadius ?? 500,
    interestCategories: [{ slug: "learning_curiosity" }],
    interestSubCategories: [],
    children: [
      {
        id: "stub-learning-child-7",
        dateOfBirth: yearsBeforeFromAnchor(STUB_TIME_ANCHOR_ISO, 7),
        interestCategories: [],
        interestSubCategories: [],
        skills: [],
      },
    ],
  };
}

export function stubParentNoChildren(overrides?: Partial<Pick<StubParentRow, "id">>): StubParentRow {
  return {
    id: overrides?.id ?? "p1",
    postCode: "HP2 7DB",
    latitude: STUB_PARENT_LAT,
    longitude: STUB_PARENT_LON,
    searchRadius: 100,
    interestCategories: [],
    interestSubCategories: [],
    children: [],
  };
}

export function stubParentWithOneChild(overrides?: {
  searchRadius?: number;
  categorySlugs?: string[];
  subCategorySlugs?: { categorySlug: string; subSlug: string }[];
  childAgeYears?: number;
}): StubParentRow {
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
        dateOfBirth: yearsBeforeFromAnchor(STUB_TIME_ANCHOR_ISO, childAge),
        interestCategories: [{ slug: "learning_curiosity" }],
        interestSubCategories: [{ slug: "animal_encounters" }],
        skills: [],
      },
    ],
  };
}

export function stubParentWithTwoChildren(): StubParentRow {
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
        dateOfBirth: yearsBeforeFromAnchor(STUB_TIME_ANCHOR_ISO, 2),
        interestCategories: [{ slug: "movement_energy" }],
        interestSubCategories: [{ slug: "soft_play" }],
        skills: [],
      },
      {
        id: "stub-child-school",
        dateOfBirth: yearsBeforeFromAnchor(STUB_TIME_ANCHOR_ISO, 8),
        interestCategories: [{ slug: "learning_curiosity" }],
        interestSubCategories: [{ slug: "animal_encounters" }],
        skills: [],
      },
    ],
  };
}

/** Venue (near) + route (far) — distance checks. */
export const CANDIDATES_NEAR_VENUE_FAR_ROUTE: RecommendationCandidate[] = [
  {
    type: "venue",
    id: "v1",
    name: "Near venue",
    description: null,
    postcode: "HP1 1BB",
    latitude: "51.751393",
    longitude: "-0.471936",
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: ["age_6", "age_7", "age_8"],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
  {
    type: "route",
    id: "r1",
    name: "Far route",
    description: null,
    postcode: "EX6 8JQ",
    latitude: "50.642928",
    longitude: "-3.462935",
    interestTags: "nature_exploration",
    themeSlug: "scenic_walks_and_wanders",
    ageSuitabilitySlugs: [],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
];

/** Close weak interest match vs far strong match — interest vs distance. */
export const CANDIDATES_INTEREST_VS_DISTANCE: RecommendationCandidate[] = [
  {
    type: "venue",
    id: "near-no-interest-match",
    name: "Close venue",
    description: null,
    postcode: "HP1 1BB",
    latitude: "51.751393",
    longitude: "-0.471936",
    interestTags: "movement_energy",
    themeSlug: "a_big_day_out",
    ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
  {
    type: "venue",
    id: "far-interest-match",
    name: "Far venue",
    description: null,
    postcode: "EX6 8JQ",
    latitude: "50.642928",
    longitude: "-3.462935",
    interestTags: "learning_curiosity",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
];

const ageSchool = ["age_5", "age_6", "age_7", "age_8", "age_9"] as const;

/** One candidate per opportunity record type. */
export const CANDIDATES_FOUR_OPPORTUNITY_TYPES: RecommendationCandidate[] = [
  {
    type: "venue",
    id: "opp-venue-hp3",
    name: "Stub venue HP3",
    description: null,
    postcode: "HP3 8JG",
    latitude: "51.73951",
    longitude: "-0.446281",
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: [...ageSchool],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
  {
    type: "event",
    id: "opp-event-hp4",
    name: "Stub event HP4",
    description: null,
    postcode: "HP4 1AB",
    latitude: "51.761548",
    longitude: "-0.568634",
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: [...ageSchool],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
  {
    type: "club",
    id: "opp-club-wd17",
    name: "Stub club WD17",
    description: null,
    postcode: "WD17 1NA",
    latitude: "51.659461",
    longitude: "-0.401221",
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: [...ageSchool],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
  {
    type: "route",
    id: "opp-route-lu1",
    name: "Stub route LU1",
    description: null,
    postcode: "LU1 1AA",
    latitude: "51.879985",
    longitude: "-0.422902",
    interestTags: "nature_exploration",
    themeSlug: "scenic_walks_and_wanders",
    ageSuitabilitySlugs: [],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
];

export type RepositoryStubOptions = {
  parent?: StubParentRow | null;
  candidates?: RecommendationCandidate[];
};

export function createRecommendationsRepositoryStub(
  options: RepositoryStubOptions = {},
): RecommendationsRepository {
  const parent = "parent" in options ? options.parent : stubParentNatureChildAge7();
  const candidates = options.candidates ?? [];
  return {
    getParentForRecommendations: vi.fn().mockResolvedValue(parent),
    getOpportunityCandidates: vi.fn().mockResolvedValue(candidates),
    getEnrichedOpportunityPayloadsForRecommendations: vi.fn().mockImplementation(
      async (refs: { type: RecommendationCandidate["type"]; id: string }[]) => {
        const map = new Map();
        for (const ref of refs) {
          const c = candidates.find((x) => x.type === ref.type && x.id === ref.id);
          if (c) {
            map.set(legKey(ref.type, ref.id), stubOpportunityPayloadFromCandidate(c));
          }
        }
        return map;
      },
    ),
  } as unknown as RecommendationsRepository;
}
