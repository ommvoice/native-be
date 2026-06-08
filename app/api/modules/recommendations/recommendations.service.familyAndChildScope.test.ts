import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNoopDrivingLegService } from "./driving-leg.service.stub.js";
import {
  createRecommendationsRepositoryStub,
  stubParentNatureChildAge7,
  STUB_TIME_ANCHOR_ISO,
} from "./recommendations.repository.stubs.js";
import {
  stubParentWithOneChild,
  stubParentWithTwoChildren,
} from "./recommendations.stub-constants.js";
import { RecommendationsService } from "./service.js";
import type { EnrichedScoredRecommendation, RecommendationCandidate } from "./types.js";

/** One fixed event near the stub parent; scores below assume this candidate + frozen clock. */
const STUB_EVENT_ID = "e-school-only" as const;

function schoolAgeEvent(id: string): RecommendationCandidate {
  return {
    type: "event",
    id,
    name: id,
    description: null,
    postcode: "HP1 1BB",
    latitude: "51.751393",
    longitude: "-0.471936",
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
    skillAreaSlug: null,
    skillAreaVariant: null,
  };
}

/**
 * Recommendation list items are full getById-shaped payloads plus scoring fields.
 * This is the stable slice we assert on so tests document the real numbers returned.
 */
function recommendationReturnCore(row: EnrichedScoredRecommendation) {
  return {
    type: row.type,
    id: row.id,
    name: row.name,
    distanceMiles: row.distanceMiles,
    drivingDistanceMiles: row.drivingDistanceMiles,
    drivingDurationSeconds: row.drivingDurationSeconds,
    score: row.score,
    scoreBreakdown: row.scoreBreakdown,
  };
}

/** Expected `recommendationReturnCore` for `schoolAgeEvent(STUB_EVENT_ID)` + two-child family stub. */
const EXPECTED_TWO_CHILD_FAMILY = {
  type: "event" as const,
  id: STUB_EVENT_ID,
  name: STUB_EVENT_ID,
  distanceMiles: 2.2,
  drivingDistanceMiles: null,
  drivingDurationSeconds: null,
  score: 63,
  scoreBreakdown: {
    interestScore: 33,
    skillScore: 50,
    ageScore: 68,
    distanceScore: 100,
    total: 63,
  },
};

/** Same candidate, school-age child only (`stub-child-school`). */
const EXPECTED_SCHOOL_CHILD_ONLY = {
  type: "event" as const,
  id: STUB_EVENT_ID,
  name: STUB_EVENT_ID,
  distanceMiles: 2.2,
  drivingDistanceMiles: null,
  drivingDurationSeconds: null,
  score: 75,
  scoreBreakdown: {
    interestScore: 50,
    skillScore: 50,
    ageScore: 100,
    distanceScore: 100,
    total: 75,
  },
};

/** Same candidate, toddler only (`stub-child-toddler`). */
const EXPECTED_TODDLER_ONLY = {
  type: "event" as const,
  id: STUB_EVENT_ID,
  name: STUB_EVENT_ID,
  distanceMiles: 2.2,
  drivingDistanceMiles: null,
  drivingDurationSeconds: null,
  score: 53,
  scoreBreakdown: {
    interestScore: 25,
    skillScore: 50,
    ageScore: 35,
    distanceScore: 100,
    total: 53,
  },
};

/** `stubParentWithOneChild` + same candidate. */
const EXPECTED_ONE_CHILD_FAMILY = {
  type: "event" as const,
  id: STUB_EVENT_ID,
  name: STUB_EVENT_ID,
  distanceMiles: 2.2,
  drivingDistanceMiles: null,
  drivingDurationSeconds: null,
  score: 79,
  scoreBreakdown: {
    interestScore: 67,
    skillScore: 50,
    ageScore: 100,
    distanceScore: 100,
    total: 79,
  },
};

/** `stubParentNatureChildAge7` + same candidate. */
const EXPECTED_NATURE_SINGLE_CHILD = {
  type: "event" as const,
  id: STUB_EVENT_ID,
  name: STUB_EVENT_ID,
  distanceMiles: 2.2,
  drivingDistanceMiles: null,
  drivingDurationSeconds: null,
  score: 88,
  scoreBreakdown: {
    interestScore: 100,
    skillScore: 50,
    ageScore: 100,
    distanceScore: 100,
    total: 88,
  },
};

describe("RecommendationsService family vs single-child scope", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STUB_TIME_ANCHOR_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("getRecommendationsForFamily loads parent without a child filter", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [schoolAgeEvent("e1")],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    await service.getRecommendationsForFamily(parent.id);

    expect(repo.getParentForRecommendations).toHaveBeenCalledTimes(1);
    expect(repo.getParentForRecommendations).toHaveBeenCalledWith(parent.id, undefined);
  });

  it("getRecommendationsForParentAndChild passes childId to the repository", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [schoolAgeEvent("e1")],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const childId = parent.children[1]!.id;

    await service.getRecommendationsForParentAndChild(parent.id, childId);

    expect(repo.getParentForRecommendations).toHaveBeenCalledWith(parent.id, childId);
  });

  it("averages age suitability across all children for family scope (full return slice)", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [schoolAgeEvent(STUB_EVENT_ID)],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForFamily(parent.id);

    // console.log('s1: ', { rows, EXPECTED_TWO_CHILD_FAMILY})
    expect(rows.map(recommendationReturnCore)).toEqual([EXPECTED_TWO_CHILD_FAMILY]);
  });

  it("uses only the chosen child's age when scoped to that child (full return slice)", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [schoolAgeEvent(STUB_EVENT_ID)],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const schoolChildId = parent.children[1]!.id;
    const toddlerChildId = parent.children[0]!.id;

    const schoolRows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId);
    expect(schoolRows.map(recommendationReturnCore)).toEqual([EXPECTED_SCHOOL_CHILD_ONLY]);
    console.log('s1: ', { schoolRows, EXPECTED_SCHOOL_CHILD_ONLY})
    
    const toddlerRows = await service.getRecommendationsForParentAndChild(
      parent.id,
      toddlerChildId,
    );
    console.log('s2: ', { toddlerRows, EXPECTED_TODDLER_ONLY})
    expect(toddlerRows.map(recommendationReturnCore)).toEqual([EXPECTED_TODDLER_ONLY]);
  });

  it("still narrows to one child when the stub returns every child regardless of childId", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [schoolAgeEvent(STUB_EVENT_ID)],
    });
    vi.mocked(repo.getParentForRecommendations).mockImplementation(async () =>
      structuredClone(parent),
    );

    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const schoolChildId = parent.children[1]!.id;

    const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId);

    expect(repo.getParentForRecommendations).toHaveBeenCalledWith(parent.id, schoolChildId);
    expect(rows.map(recommendationReturnCore)).toEqual([EXPECTED_SCHOOL_CHILD_ONLY]);
  });

  it("throws when childId does not match any returned child", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [schoolAgeEvent("e1")],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    await expect(
      service.getRecommendationsForParentAndChild(parent.id, "00000000-0000-4000-8000-000000000099"),
    ).rejects.toThrow("No children registered");
  });

  it("getRecommendationsForFamily matches getRecommendationsForParent without childId", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [schoolAgeEvent(STUB_EVENT_ID)],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const a = await service.getRecommendationsForFamily(parent.id);
    const b = await service.getRecommendationsForParent({ parentId: parent.id });

    expect(a.map(recommendationReturnCore)).toEqual([EXPECTED_TWO_CHILD_FAMILY]);
    expect(b.map(recommendationReturnCore)).toEqual([EXPECTED_TWO_CHILD_FAMILY]);
  });

  describe("single-child parent stubs", () => {
    it("stubParentWithOneChild: getRecommendationsForParentAndChild matches family (full return slice)", async () => {
      const parent = stubParentWithOneChild();
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: [schoolAgeEvent(STUB_EVENT_ID)],
      });
      const service = new RecommendationsService(repo, createNoopDrivingLegService());
      const childId = parent.children[0]!.id;

      const familyRows = await service.getRecommendationsForFamily(parent.id);
      const scopedRows = await service.getRecommendationsForParentAndChild(parent.id, childId);

      expect(repo.getParentForRecommendations).toHaveBeenLastCalledWith(parent.id, childId);
      expect(familyRows.map(recommendationReturnCore)).toEqual([EXPECTED_ONE_CHILD_FAMILY]);
      expect(scopedRows.map(recommendationReturnCore)).toEqual([EXPECTED_ONE_CHILD_FAMILY]);
    });

    it("stubParentNatureChildAge7: scoped child id matches full parent recommendations (full return slice)", async () => {
      const parent = stubParentNatureChildAge7();
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: [schoolAgeEvent(STUB_EVENT_ID)],
      });
      const service = new RecommendationsService(repo, createNoopDrivingLegService());

      const full = await service.getRecommendationsForParent({ parentId: parent.id });
      const scoped = await service.getRecommendationsForParentAndChild(
        parent.id,
        "stub-nature-child-7",
      );

      expect(repo.getParentForRecommendations).toHaveBeenLastCalledWith(parent.id, "stub-nature-child-7");
      expect(full.map(recommendationReturnCore)).toEqual([EXPECTED_NATURE_SINGLE_CHILD]);
      expect(scoped.map(recommendationReturnCore)).toEqual([EXPECTED_NATURE_SINGLE_CHILD]);
    });

    it("stubParentWithOneChild: repository receives childId for single-child scope", async () => {
      const parent = stubParentWithOneChild();
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: [schoolAgeEvent(STUB_EVENT_ID)],
      });
      const service = new RecommendationsService(repo, createNoopDrivingLegService());

      const rows = await service.getRecommendationsForParentAndChild(parent.id, "stub-child-1");

      expect(repo.getParentForRecommendations).toHaveBeenCalledWith(parent.id, "stub-child-1");
      expect(rows.map(recommendationReturnCore)).toEqual([EXPECTED_ONE_CHILD_FAMILY]);
    });
  });
});
