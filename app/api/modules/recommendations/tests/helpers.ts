import { createNoopDrivingLegService } from "../driving-leg.service.stub.js";
import {
  createRecommendationsRepositoryStub,
  STUB_TIME_ANCHOR_ISO,
  type StubParentRow,
} from "./repository.stubs.js";
import { RecommendationsService } from "../service.js";
import type { EnrichedScoredRecommendation, RecommendationCandidate } from "../types.js";

export { STUB_TIME_ANCHOR_ISO };

export function recommendationReturnCore(row: EnrichedScoredRecommendation) {
  return {
    type: row.type,
    id: row.id,
    name: row.name,
    distanceMiles: row.distanceMiles,
    drivingDistanceMiles: row.drivingDistanceMiles,
    drivingDurationSeconds: row.drivingDurationSeconds,
    score: row.score,
    scoreBreakdown: { ...row.scoreBreakdown },
  };
}

export function makeRecommendationsTestService(
  parent: StubParentRow | null,
  candidates: RecommendationCandidate[],
) {
  const repo = createRecommendationsRepositoryStub({ parent, candidates });
  const service = new RecommendationsService(repo, createNoopDrivingLegService());
  return { service, repo };
}

export function stubChildSkill(
  slug: string,
  subCategory: { slug: string } | null = null,
  minAge: number | null = null,
  maxAge: number | null = null,
) {
  return { slug, minAge, maxAge, subCategory };
}

/** Shared HP1 1BB coords; merge overrides for per-type skill/age/interest tweaks. */
export function candidateAtHp1(
  id: string,
  type: RecommendationCandidate["type"],
  overrides: Partial<RecommendationCandidate> = {},
): RecommendationCandidate {
  return {
    type,
    id,
    name: id,
    description: null,
    postcode: "HP1 1BB",
    latitude: "51.751393",
    longitude: "-0.471936",
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: ["age_6", "age_7", "age_8"],
    skillAreaSlug: null,
    skillAreaVariant: null,
    ...overrides,
  };
}
