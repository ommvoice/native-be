import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNoopDrivingLegService } from "./driving-leg.service.stub.js";
import {
  createRecommendationsV2RepositoryStub,
  makeV2Candidate,
  stubParentV2ForRecommendations,
  stubParentV2WithInterestCategorySlugs,
  STUB_TIME_ANCHOR_ISO,
  V2_EMPTY_AGE_BANDS,
  V2_STUB_PARENT_LAT,
  V2_STUB_PARENT_LON,
} from "./recommendations_v2.repository.stubs.js";
import { RecommendationsV2Service } from "../service.js";

describe("RecommendationsV2Service.getRecommendationsForParent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STUB_TIME_ANCHOR_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns only venue opportunities when the repository yields venues only", async () => {
    const parent = stubParentV2ForRecommendations();
    const repo = createRecommendationsV2RepositoryStub({
      parent,
      candidates: [makeV2Candidate("venue", "venue-only-1", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON)],
    });
    const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({ parentId: parent.id });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.opportunityType).toBe("venue");
    expect(rows[0]!.id).toBe("venue-only-1");
    expect(rows[0]!.score).toBeGreaterThan(0);
  });

  it("returns only event opportunities when the repository yields events only", async () => {
    const parent = stubParentV2ForRecommendations();
    const repo = createRecommendationsV2RepositoryStub({
      parent,
      candidates: [makeV2Candidate("event", "event-only-1", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON)],
    });
    const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({ parentId: parent.id });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.opportunityType).toBe("event");
    expect(rows[0]!.id).toBe("event-only-1");
    expect(rows[0]!.score).toBeGreaterThan(0);
  });

  it("returns only route opportunities when the repository yields routes only", async () => {
    const parent = stubParentV2ForRecommendations();
    const repo = createRecommendationsV2RepositoryStub({
      parent,
      candidates: [makeV2Candidate("route", "route-only-1", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON)],
    });
    const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({ parentId: parent.id });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.opportunityType).toBe("route");
    expect(rows[0]!.id).toBe("route-only-1");
    expect(rows[0]!.score).toBeGreaterThan(0);
  });

  it("returns only club opportunities when the repository yields clubs only", async () => {
    const parent = stubParentV2ForRecommendations();
    const repo = createRecommendationsV2RepositoryStub({
      parent,
      candidates: [makeV2Candidate("club", "club-only-1", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON)],
    });
    const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({ parentId: parent.id });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.opportunityType).toBe("club");
    expect(rows[0]!.id).toBe("club-only-1");
    expect(rows[0]!.score).toBeGreaterThan(0);
  });

  it("returns all four opportunity types sorted by score when each type is present", async () => {
    const parent = stubParentV2ForRecommendations();
    /** Same longitude; latitude steps south so crow-fly distance increases (lower distance score). */
    const latParent = V2_STUB_PARENT_LAT;
    const latNear = "51.773282";
    const latMid = "51.628282";
    const latFar = "51.483282";
    const latFarthest = "51.338282";

    const candidates = [
      makeV2Candidate("venue", "v-all", latNear, V2_STUB_PARENT_LON),
      makeV2Candidate("event", "e-all", latMid, V2_STUB_PARENT_LON),
      makeV2Candidate("route", "r-all", latFar, V2_STUB_PARENT_LON),
      makeV2Candidate("club", "c-all", latFarthest, V2_STUB_PARENT_LON),
    ];

    const repo = createRecommendationsV2RepositoryStub({ parent, candidates });
    const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({ parentId: parent.id });

    expect(rows).toHaveLength(4);
    const types = rows.map((r) => r.opportunityType);
    expect(new Set(types)).toEqual(new Set(["venue", "event", "route", "club"]));

    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i]!.score).toBeGreaterThanOrEqual(rows[i + 1]!.score);
    }
    expect(rows[0]!.id).toBe("v-all");
    expect(rows[0]!.score).toBeGreaterThan(rows[3]!.score);
  });

  describe("scoring: interest, age, and distance", () => {
    const band5To7Only = {
      ...V2_EMPTY_AGE_BANDS,
      ages5To7: true,
    };
    const band8To12Only = {
      ...V2_EMPTY_AGE_BANDS,
      ages8To12: true,
    };

    it("ranks higher theme overlap above lower when age and crow-fly distance are the same", async () => {
      const parent = stubParentV2WithInterestCategorySlugs(["alpha", "beta"]);
      const candidates = [
        makeV2Candidate("venue", "interest-partial", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON, {
          themeSlug: "alpha",
          themeVariantSlug: "",
        }),
        makeV2Candidate("venue", "interest-full", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON, {
          themeSlug: "alpha",
          themeVariantSlug: "beta",
        }),
      ];
      const repo = createRecommendationsV2RepositoryStub({ parent, candidates });
      const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

      const rows = await service.getRecommendationsForParent({ parentId: parent.id });

      expect(rows).toHaveLength(2);
      expect(rows[0]!.id).toBe("interest-full");
      expect(rows[1]!.id).toBe("interest-partial");
      expect(rows[0]!.scoreBreakdown.interestScore).toBe(100);
      expect(rows[1]!.scoreBreakdown.interestScore).toBe(50);
      expect(rows[0]!.score).toBeGreaterThan(rows[1]!.score);
    });

    it("ranks age-suitable opportunity above a soft age mismatch when interest and distance align", async () => {
      const parent = stubParentV2ForRecommendations();
      const candidates = [
        makeV2Candidate("venue", "age-soft-mismatch", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON, {
          ageBands: band8To12Only,
        }),
        makeV2Candidate("venue", "age-good", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON, {
          ageBands: band5To7Only,
        }),
      ];
      const repo = createRecommendationsV2RepositoryStub({ parent, candidates });
      const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

      const rows = await service.getRecommendationsForParent({ parentId: parent.id });

      expect(rows).toHaveLength(2);
      expect(rows[0]!.id).toBe("age-good");
      expect(rows[1]!.id).toBe("age-soft-mismatch");
      expect(rows[0]!.scoreBreakdown.ageScore).toBe(100);
      expect(rows[1]!.scoreBreakdown.ageScore).toBe(35);
      expect(rows[0]!.score).toBeGreaterThan(rows[1]!.score);
    });

    it("ranks nearer opportunity higher when interest and age scores align", async () => {
      const parent = stubParentV2ForRecommendations();
      const latNear = V2_STUB_PARENT_LAT;
      const latFar = "51.628282";
      const candidates = [
        makeV2Candidate("venue", "dist-far", latFar, V2_STUB_PARENT_LON),
        makeV2Candidate("venue", "dist-near", latNear, V2_STUB_PARENT_LON),
      ];
      const repo = createRecommendationsV2RepositoryStub({ parent, candidates });
      const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

      const rows = await service.getRecommendationsForParent({ parentId: parent.id });

      expect(rows).toHaveLength(2);
      expect(rows[0]!.id).toBe("dist-near");
      expect(rows[1]!.id).toBe("dist-far");
      expect(rows[0]!.scoreBreakdown.distanceScore).toBeGreaterThan(rows[1]!.scoreBreakdown.distanceScore);
      expect(rows[0]!.score).toBeGreaterThan(rows[1]!.score);
    });

    it("excludes opportunities beyond the parent's search radius (crow-fly hard filter)", async () => {
      const parent = stubParentV2ForRecommendations({ searchRadius: 10 });
      /** ~11+ miles south of the stub parent at this longitude (outside 10 mi radius). */
      const latOutside = "51.613282";
      const candidates = [
        makeV2Candidate("venue", "in-radius", V2_STUB_PARENT_LAT, V2_STUB_PARENT_LON),
        makeV2Candidate("venue", "out-of-radius", latOutside, V2_STUB_PARENT_LON),
      ];
      const repo = createRecommendationsV2RepositoryStub({ parent, candidates });
      const service = new RecommendationsV2Service(repo, createNoopDrivingLegService());

      const rows = await service.getRecommendationsForParent({ parentId: parent.id });

      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe("in-radius");
    });
  });
});
