import { describe, it, expect, vi, afterEach } from "vitest";

import { RecommendationV2Service } from "../app/services/recommendation-v2.service.js";
import { RecommendationV2Repository } from "../app/repositories/recommendation-v2.repository.js";
import { DrivingLegService } from "../app/services/driving-leg.service.js";
import params from "../app/shared/assets/params.json" with { type: "json" };

// getOpportunityCandidatesV2/getEnrichedPayloads read from the static JSON
// assets (see AssetsService) so they work for real here, same as the sibling
// getItemsWithScore suite — only the two parent-specific DynamoDB lookups
// (the parent record itself, and its cached driving legs) need stubbing.
const narrowed = {
  ...params.narrowed,
  children: params.narrowed.children.map((c) => ({
    ...c,
    dateOfBirth: new Date(c.dateOfBirth),
  })),
};

function stubRepoAndDrivingLegs() {
  vi.spyOn(RecommendationV2Repository.prototype, "getParentForRecommendations").mockResolvedValue(narrowed as any);
  vi.spyOn(DrivingLegService.prototype, "ensureLegsCached").mockResolvedValue(new Map());
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RecommendationV2Service.getRecommendations searchRadius override", () => {
  it("uses the parent's persisted searchRadius when no override is given", async () => {
    stubRepoAndDrivingLegs();
    const service = new RecommendationV2Service();
    const { data } = await service.getRecommendations({ parentId: narrowed.id });

    for (const item of data) {
      expect(item.distanceMiles).toBeLessThanOrEqual(narrowed.searchRadius);
    }
  });

  it("overrides the distance filter with a valid searchRadius param", async () => {
    stubRepoAndDrivingLegs();
    const service = new RecommendationV2Service();
    const narrowRadius = "0.01";
    const { data } = await service.getRecommendations({ parentId: narrowed.id, searchRadius: narrowRadius });

    for (const item of data) {
      expect(item.distanceMiles).toBeLessThanOrEqual(Number(narrowRadius));
    }
  });

  it("falls back to the parent's persisted searchRadius when searchRadius is malformed", async () => {
    stubRepoAndDrivingLegs();
    const service = new RecommendationV2Service();
    const { data } = await service.getRecommendations({ parentId: narrowed.id, searchRadius: "not-a-number" });

    for (const item of data) {
      expect(item.distanceMiles).toBeLessThanOrEqual(narrowed.searchRadius);
    }
  });
});
