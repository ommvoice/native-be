/**
 * Fixtures and `RecommendationsV2Repository` test doubles for v2 recommendation service tests.
 */
import { vi } from "vitest";
import type { OpportunityRecordType } from "../../../types/db.js";
import { legKey } from "../driving-leg-keys.js";
import type { RecommendationsV2Repository } from "../repository.js";
import type { RecommendationV2Candidate, RecommendationV2OpportunityPayload } from "../types.js";

export const STUB_TIME_ANCHOR_ISO = "2026-06-15T12:00:00Z";

export function yearsBeforeFromAnchor(isoDate: string, years: number): Date {
  const d = new Date(isoDate);
  d.setFullYear(d.getFullYear() - years);
  return d;
}

/** Parent row shape aligned with Prisma `Parents` + repository include for v2. */
export type StubParentV2Row = {
  id: string;
  postCode: string;
  latitude: string;
  longitude: string;
  searchRadius: number;
  interestCategories: { slug: string }[];
  interestSubCategories: { slug: string }[];
  children: {
    id: string;
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

export const V2_STUB_PARENT_LAT = "51.773282";
export const V2_STUB_PARENT_LON = "-0.434612";

/** Theme slug `theme_match` on parent so interest overlap is 100% for candidates using that theme. */
export function stubParentV2ForRecommendations(
  overrides?: Partial<Pick<StubParentV2Row, "id" | "searchRadius">>,
): StubParentV2Row {
  return {
    id: overrides?.id ?? "p-v2",
    postCode: "HP2 7DB",
    latitude: V2_STUB_PARENT_LAT,
    longitude: V2_STUB_PARENT_LON,
    searchRadius: overrides?.searchRadius ?? 50,
    interestCategories: [{ slug: "theme_match" }],
    interestSubCategories: [],
    children: [
      {
        id: "c-v2-1",
        dateOfBirth: yearsBeforeFromAnchor(STUB_TIME_ANCHOR_ISO, 7),
        interestCategories: [],
        interestSubCategories: [],
        skills: [],
      },
    ],
  };
}

/** Parent with explicit category slugs (for interest-overlap tests). */
export function stubParentV2WithInterestCategorySlugs(
  categorySlugs: string[],
  overrides?: Partial<Pick<StubParentV2Row, "id" | "searchRadius">>,
): StubParentV2Row {
  const base = stubParentV2ForRecommendations(overrides);
  return {
    ...base,
    interestCategories: categorySlugs.map((slug) => ({ slug })),
  };
}

export const V2_EMPTY_AGE_BANDS: RecommendationV2Candidate["ageBands"] = {
  under1: null,
  ages1To2: null,
  ages3To4: null,
  ages5To7: null,
  ages8To12: null,
  over13: null,
  adults: null,
};

export function makeV2Candidate(
  type: OpportunityRecordType,
  id: string,
  latitude: string,
  longitude: string,
  overrides?: Partial<Omit<RecommendationV2Candidate, "type" | "id" | "latitude" | "longitude">>,
): RecommendationV2Candidate {
  return {
    type,
    id,
    name: id,
    description: null,
    postcode: "HP2 7DB",
    latitude,
    longitude,
    themeSlug: "theme_match",
    themeVariantSlug: "",
    ageBands: V2_EMPTY_AGE_BANDS,
    skillAreaSlug: null,
    skillAreaVariant: null,
    ...overrides,
  };
}

/** Minimal API payload so `attachEnrichedOpportunityPayloads` can merge scores; tests assert ids/types/scores only. */
function stubEnrichedPayloadForType(
  type: OpportunityRecordType,
  id: string,
): RecommendationV2OpportunityPayload {
  const theme = { id: "stub-theme", slug: "theme_match", name: "Stub theme", recordType: "stub" };
  const themeVariant = { id: "stub-variant", slug: "stub-variant", name: "Stub variant" };

  if (type === "venue") {
    return {
      id,
      opportunityType: "venue",
      theme,
      themeVariant,
      venueName: `Stub venue ${id}`,
    } as unknown as RecommendationV2OpportunityPayload;
  }
  if (type === "event") {
    return {
      id,
      opportunityType: "event",
      theme,
      themeVariant,
      eventName: `Stub event ${id}`,
    } as unknown as RecommendationV2OpportunityPayload;
  }
  if (type === "route") {
    return {
      id,
      opportunityType: "route",
      theme,
      themeVariant,
      routeName: `Stub route ${id}`,
    } as unknown as RecommendationV2OpportunityPayload;
  }
  return {
    id,
    opportunityType: "club",
    theme,
    themeVariant,
    clubName: `Stub club ${id}`,
  } as unknown as RecommendationV2OpportunityPayload;
}

export function createRecommendationsV2RepositoryStub(input: {
  parent: StubParentV2Row | null;
  candidates: RecommendationV2Candidate[];
}): RecommendationsV2Repository {
  const getParentForRecommendations = vi.fn().mockResolvedValue(input.parent);
  const getOpportunityCandidatesV2 = vi.fn().mockResolvedValue(input.candidates);
  const getEnrichedOpportunityPayloadsForRecommendationsV2 = vi
    .fn()
    .mockImplementation(async (refs: { type: OpportunityRecordType; id: string }[]) => {
      const map = new Map<string, RecommendationV2OpportunityPayload>();
      for (const r of refs) {
        map.set(legKey(r.type, r.id), stubEnrichedPayloadForType(r.type, r.id));
      }
      return map;
    });

  return {
    getParentForRecommendations,
    getOpportunityCandidatesV2,
    getEnrichedOpportunityPayloadsForRecommendationsV2,
  } as unknown as RecommendationsV2Repository;
}
