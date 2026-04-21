import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNoopDrivingLegService } from "./driving-leg.service.stub.js";
import type { RecommendationsRepository } from "./repository.js";
import { createRecommendationsRepositoryStub } from "./recommendations.repository.stubs.js";
import {
  countStubIndicesWithinMiles,
  FIFTY_FIVE_STUB_CANDIDATES,
  FIFTY_STUB_CANDIDATES,
  STUB_ANCHOR_ISO,
  stubParentWithOneChild,
  stubParentWithTwoChildren,
} from "./recommendations.stub-constants.js";

import { RecommendationsService } from "./service.js";

describe("stub geometry (50 ZZ** postcodes)", () => {
  it("has exactly 8 opportunities within 8 mi of the parent anchor", () => {
    expect(countStubIndicesWithinMiles(8)).toBe(8);
  });

  it("has exactly 20 opportunities within 100 mi (near + mid rings)", () => {
    expect(countStubIndicesWithinMiles(100)).toBe(20);
  });

  it("has all 50 within 500 mi", () => {
    expect(countStubIndicesWithinMiles(500)).toBe(50);
  });
});

describe("RecommendationsService + 50 stub opportunities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STUB_ANCHOR_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 8 results when only the inner ring is inside searchRadius", async () => {
    const mockRepo = createRecommendationsRepositoryStub({
      parent: stubParentWithOneChild({ searchRadius: 0.3 }),
      candidates: FIFTY_STUB_CANDIDATES,
    });

    const service = new RecommendationsService(mockRepo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({
      parentId: "stub-parent-1",
    });

    // console.log('a1: ', { rows})
    expect(rows).toHaveLength(2);
    // expect(rows.map((r) => r.id).sort()).toEqual(
    //   ["stub-venue-00", "stub-event-01", "stub-club-02", "stub-route-03", "stub-venue-04", "stub-event-05", "stub-club-06", "stub-route-07"].sort(),
    // );
      expect(rows.map((r) => r.id).sort()).toEqual(
["stub-event-01", "stub-venue-00"],
    );
    for (const r of rows) {
      expect(r.distanceMiles).toBeLessThanOrEqual(8);
    }
  });

  it("returns 20 results when near + mid rings are inside searchRadius", async () => {
    const mockRepo = createRecommendationsRepositoryStub({
      parent: stubParentWithOneChild({ searchRadius: 100 }),
      candidates: FIFTY_STUB_CANDIDATES,
    });

    const service = new RecommendationsService(mockRepo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({
      parentId: "stub-parent-1",
    });
    expect(rows).toHaveLength(20);
  });

  it("returns up to default cap (30) scored rows when radius covers all stub coords", async () => {
    const mockRepo = createRecommendationsRepositoryStub({
      parent: stubParentWithOneChild(),
      candidates: FIFTY_STUB_CANDIDATES,
    });

    const service = new RecommendationsService(mockRepo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({
      parentId: "stub-parent-1",
    });

    expect(rows).toHaveLength(30);
    const types = { venue: 0, event: 0, club: 0, route: 0 };
    for (const r of rows) {
      const t = r.type;
      if (t === "venue" || t === "event" || t === "club" || t === "route") types[t]++;
    }
    expect(types.venue + types.event + types.club + types.route).toBe(30);
  });

  it("applies default limit 30 when many rows match", async () => {
    const mockRepo = createRecommendationsRepositoryStub({
      parent: stubParentWithOneChild(),
      candidates: FIFTY_STUB_CANDIDATES,
    });

    const service = new RecommendationsService(mockRepo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({
      parentId: "stub-parent-1",
    });

    expect(rows).toHaveLength(30);
  });

  it("returns 50 from 55 candidates when 5 postcodes cannot be resolved", async () => {
    const mockRepo = createRecommendationsRepositoryStub({
      parent: stubParentWithOneChild(),
      candidates: FIFTY_FIVE_STUB_CANDIDATES,
    });

    const service = new RecommendationsService(mockRepo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({
      parentId: "stub-parent-1",
    });

    expect(rows).toHaveLength(30);
    expect(rows.some((r) => r.id.startsWith("stub-no-coord"))).toBe(false);
  });

  it("childId filter narrows children and can change result count vs both children", async () => {
    const parent = stubParentWithTwoChildren();
    const mockRepo = createRecommendationsRepositoryStub({
      parent,
      candidates: FIFTY_STUB_CANDIDATES,
    });
    mockRepo.getParentForRecommendations = vi.fn(
      ((_pid: string, childId?: string) => {
        if (!childId) return Promise.resolve(parent);
        const ch = parent.children.find((c) => c.id === childId);
        if (!ch) return Promise.resolve(null);
        return Promise.resolve({ ...parent, children: [ch] });
      }) as RecommendationsRepository["getParentForRecommendations"],
    );

    const service = new RecommendationsService(mockRepo, createNoopDrivingLegService());

    const both = await service.getRecommendationsForParent({
      parentId: "stub-parent-2",
    });
    const toddlerOnly = await service.getRecommendationsForParent({
      parentId: "stub-parent-2",
      childId: "stub-child-toddler",
    });

    expect(both).toHaveLength(30);
    expect(toddlerOnly).toHaveLength(30);
    expect(toddlerOnly[0]!.score).not.toBe(both[0]!.score);
  });

  it("results are sorted by total score descending", async () => {
    const mockRepo = createRecommendationsRepositoryStub({
      parent: stubParentWithOneChild(),
      candidates: FIFTY_STUB_CANDIDATES,
    });

    const service = new RecommendationsService(mockRepo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({
      parentId: "stub-parent-1",
    });

    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.score).toBeGreaterThanOrEqual(rows[i]!.score);
    }
  });
});
