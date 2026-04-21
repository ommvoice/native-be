import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createDrivingLegServiceRecording,
  createDrivingLegServiceReturning,
  createNoopDrivingLegService,
} from "./driving-leg.service.stub.js";
import { metersToMilesOneDecimal } from "./driving-leg.service.js";
import { legKey } from "./driving-leg.repository.js";
import {
  CANDIDATES_FOUR_OPPORTUNITY_TYPES,
  CANDIDATES_INTEREST_VS_DISTANCE,
  CANDIDATES_NEAR_VENUE_FAR_ROUTE,
  CANDIDATES_TWO_VENUES_DRIVING,
  createRecommendationsRepositoryStub,
  stubParentLearningCuriosityChildAge7,
  stubParentNatureChildAge7,
  stubParentNoChildren,
  STUB_TIME_ANCHOR_ISO,
} from "./recommendations.repository.stubs.js";
import { RecommendationsService } from "./service.js";

describe("RecommendationsService.getRecommendationsForParentNearby", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STUB_TIME_ANCHOR_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when parent is missing", async () => {
    const repo = createRecommendationsRepositoryStub({ parent: null, candidates: [] });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    await expect(service.getRecommendationsForParentNearby({ parentId: "x" })).rejects.toThrow(
      "Parent not found.",
    );
  });

  it("throws when parent has no children", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNoChildren(),
      candidates: [],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    await expect(service.getRecommendationsForParentNearby({ parentId: "p1" })).rejects.toThrow(
      "No children registered",
    );
  });

  it("sets interestScore and skillScore to 0 and total from age + distance only", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNatureChildAge7(),
      candidates: CANDIDATES_NEAR_VENUE_FAR_ROUTE,
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParentNearby({
      parentId: "p1",
    });

    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.scoreBreakdown.interestScore).toBe(0);
      expect(r.scoreBreakdown.skillScore).toBe(0);
      expect(r.score).toBe(
        Math.round((r.scoreBreakdown.ageScore + r.scoreBreakdown.distanceScore) / 2),
      );
    }
  });

  it("ranks by proximity while full mode favours interest match farther away", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentLearningCuriosityChildAge7(),
      candidates: CANDIDATES_INTEREST_VS_DISTANCE,
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const full = await service.getRecommendationsForParent({
      parentId: "p1",
    });
    const nearby = await service.getRecommendationsForParentNearby({
      parentId: "p1",
    });

    expect(full[0]!.id).toBe("far-interest-match");
    expect(nearby[0]!.id).toBe("near-no-interest-match");
    expect(nearby[0]!.scoreBreakdown.interestScore).toBe(0);
    expect(nearby[0]!.scoreBreakdown.skillScore).toBe(0);
    expect(full[0]!.scoreBreakdown.interestScore).toBeGreaterThan(0);
  });

  it("applies the same parent searchRadius filter as full recommendations", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentLearningCuriosityChildAge7({ searchRadius: 3 }),
      candidates: CANDIDATES_INTEREST_VS_DISTANCE,
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParentNearby({
      parentId: "p1",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("near-no-interest-match");
  });

  it("includes venue, event, club, and route when all have coordinates", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNatureChildAge7(),
      candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParentNearby({
      parentId: "p1",
    });

    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.type))).toEqual(new Set(["venue", "event", "club", "route"]));
  });

  it("hydrateDrivingLegs receives four routable legs for nearby (same pool as full)", async () => {
    const { service: driving, getCalls } = createDrivingLegServiceRecording();
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNatureChildAge7(),
      candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
    });
    const svc = new RecommendationsService(repo, driving);

    await svc.getRecommendationsForParentNearby({ parentId: "p1" });

    expect(getCalls()).toHaveLength(1);
    expect(getCalls()[0]!.legs).toHaveLength(4);
    expect(new Set(getCalls()[0]!.legs.map((l) => l.type))).toEqual(
      new Set(["venue", "event", "club", "route"]),
    );
  });

  describe("parent_opportunity_driving_legs merge (nearby)", () => {
    const parent = stubParentNatureChildAge7({ id: "parent-nearby-driving" });

    it("merges driving metrics for each type when map is complete", async () => {
      const drivingMap = new Map([
        [legKey("venue", "opp-venue-hp3"), { drivingDistanceMeters: 3000, drivingDurationSeconds: 300 }],
        [legKey("event", "opp-event-hp4"), { drivingDistanceMeters: 3100, drivingDurationSeconds: 310 }],
        [legKey("club", "opp-club-wd17"), { drivingDistanceMeters: 3200, drivingDurationSeconds: 320 }],
        [legKey("route", "opp-route-lu1"), { drivingDistanceMeters: 3300, drivingDurationSeconds: 330 }],
      ]);
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(drivingMap));

      const rows = await service.getRecommendationsForParentNearby({
        parentId: parent.id,
      });

      const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
      expect(byId["opp-venue-hp3"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(3000));
      expect(byId["opp-event-hp4"]!.drivingDurationSeconds).toBe(310);
      expect(byId["opp-club-wd17"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(3200));
      expect(byId["opp-route-lu1"]!.drivingDurationSeconds).toBe(330);
    });

    it("partial map: filled legs only for keys present", async () => {
      const drivingMap = new Map([
        [legKey("event", "opp-event-hp4"), { drivingDistanceMeters: 9000, drivingDurationSeconds: 900 }],
        [legKey("club", "opp-club-wd17"), { drivingDistanceMeters: 9100, drivingDurationSeconds: 910 }],
      ]);
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(drivingMap));

      const rows = await service.getRecommendationsForParentNearby({
        parentId: parent.id,
      });

      const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
      expect(byId["opp-event-hp4"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(9000));
      expect(byId["opp-club-wd17"]!.drivingDurationSeconds).toBe(910);
      expect(byId["opp-venue-hp3"]!.drivingDistanceMiles).toBeNull();
      expect(byId["opp-route-lu1"]!.drivingDistanceMiles).toBeNull();
    });

    it("two venues: merge matches full recommendations behaviour", async () => {
      const drivingMap = new Map([
        [legKey("venue", "venue-a"), { drivingDistanceMeters: 3218, drivingDurationSeconds: 600 }],
      ]);
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: CANDIDATES_TWO_VENUES_DRIVING,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(drivingMap));

      const rows = await service.getRecommendationsForParentNearby({
        parentId: parent.id,
      });

      const a = rows.find((r) => r.id === "venue-a");
      const b = rows.find((r) => r.id === "venue-b");
      expect(a!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(3218));
      expect(a!.drivingDurationSeconds).toBe(600);
      expect(b!.drivingDistanceMiles).toBeNull();
      expect(b!.drivingDurationSeconds).toBeNull();
    });
  });
});
