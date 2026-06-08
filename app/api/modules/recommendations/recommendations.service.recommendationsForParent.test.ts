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
  CANDIDATES_NEAR_VENUE_FAR_ROUTE,
  createRecommendationsRepositoryStub,
  stubParentNatureChildAge7,
  stubParentNoChildren,
  STUB_TIME_ANCHOR_ISO,
} from "./recommendations.repository.stubs.js";
import { stubParentWithTwoChildren } from "./recommendations.stub-constants.js";
import { RecommendationsService } from "./service.js";
import type { RecommendationCandidate } from "./types.js";

/** Skill row shape aligned with Prisma `Skill` + recommendations include (open ages = no filter). */
function stubChildSkill(
  slug: string,
  subCategory: { slug: string } | null,
  minAge: number | null = null,
  maxAge: number | null = null,
) {
  return { slug, minAge, maxAge, subCategory };
}

/** Same geo + interest; skill fields and optional age slugs differ between rows. */
function baseSkillCompareCandidate(
  id: string,
  type: RecommendationCandidate["type"],
  skillAreaSlug: string | null,
  skillAreaVariant: string | null,
  ageSuitabilitySlugs: string[] = ["age_6", "age_7", "age_8"],
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
    ageSuitabilitySlugs,
    skillAreaSlug,
    skillAreaVariant,
  };
}

describe("RecommendationsService.getRecommendationsForParent", () => {
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

    await expect(service.getRecommendationsForParent({ parentId: "x" })).rejects.toThrow(
      "Parent not found.",
    );
    expect(vi.mocked(repo.getOpportunityCandidates)).not.toHaveBeenCalled();
  });

  it("throws when parent has no children", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNoChildren(),
      candidates: [],
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    await expect(service.getRecommendationsForParent({ parentId: "p1" })).rejects.toThrow(
      "No children registered",
    );
  });

  it("ranks nearer opportunity higher when interests and age fit", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNatureChildAge7(),
      candidates: CANDIDATES_NEAR_VENUE_FAR_ROUTE,
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({
      parentId: "p1",
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]!.id).toBe("v1");
    expect(rows[0]!.score).toBeGreaterThan(rows[1]!.score);
    expect(rows[0]!.scoreBreakdown.interestScore).toBe(100);
  });

  it("ranks event with matching skill area above venue when interest, age, and distance align", async () => {
    const parent = stubParentNatureChildAge7();
    parent.children[0]!.skills = [stubChildSkill("sports", null)];

    const skillCandidates: RecommendationCandidate[] = [
      {
        type: "venue",
        id: "v-neutral",
        name: "Venue",
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
        type: "event",
        id: "e-sports",
        name: "Sports event",
        description: null,
        postcode: "HP1 1BB",
        latitude: "51.751393",
        longitude: "-0.471936",
        interestTags: "nature_exploration",
        themeSlug: "animal_encounters",
        ageSuitabilitySlugs: ["age_6", "age_7", "age_8"],
        skillAreaSlug: "sports",
        skillAreaVariant: null,
      },
    ];

    const repo = createRecommendationsRepositoryStub({ parent, candidates: skillCandidates });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({ parentId: "p1" });

    console.log('a1: ', {parent: JSON.stringify(parent), rows})
    expect(rows[0]!.id).toBe("e-sports");
    expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(rows.find((r) => r.id === "v-neutral")!.scoreBreakdown.skillScore).toBe(50);
    expect(rows[0]!.score).toBeGreaterThan(rows.find((r) => r.id === "v-neutral")!.score);
  });

  it("with matching skills and distance, ranks opportunity with age-appropriate slugs above one that excludes the child", async () => {
    const parent = stubParentNatureChildAge7();
    parent.children[0]!.skills = [stubChildSkill("sports", null)];

    const skillCandidates: RecommendationCandidate[] = [
      baseSkillCompareCandidate(
        "e-sports-teens-only",
        "event",
        "sports",
        null,
        ["age_13_plus", "age_16_plus"],
      ),
      baseSkillCompareCandidate("e-sports-school-age", "event", "sports", null, [
        "age_6",
        "age_7",
        "age_8",
      ]),
    ];

    const repo = createRecommendationsRepositoryStub({ parent, candidates: skillCandidates });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({ parentId: "p1" });
    console.log('a1: ', {parent: JSON.stringify(parent), rows})
    expect(rows[0]!.id).toBe("e-sports-school-age");
    expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(rows[0]!.scoreBreakdown.ageScore).toBe(100);
    const teens = rows.find((r) => r.id === "e-sports-teens-only")!;
    expect(teens.scoreBreakdown.skillScore).toBe(100);
    expect(teens.scoreBreakdown.ageScore).toBe(35);
    expect(rows[0]!.score).toBeGreaterThan(teens.score);
  });

  it("strong skill match with poor age fit can rank below neutral skill with full age fit", async () => {
    const parent = stubParentNatureChildAge7();
    parent.children[0]!.skills = [stubChildSkill("sports", null)];

    const skillCandidates: RecommendationCandidate[] = [
      baseSkillCompareCandidate(
        "e-perfect-skill-wrong-age",
        "event",
        "sports",
        null,
        ["age_13_plus", "age_16_plus"],
      ),
      baseSkillCompareCandidate("e-no-skill-fields-right-age", "event", null, null, [
        "age_6",
        "age_7",
        "age_8",
      ]),
    ];

    const repo = createRecommendationsRepositoryStub({ parent, candidates: skillCandidates });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({ parentId: "p1" });
    console.log('a1: ', {parent: JSON.stringify(parent), rows})
    expect(rows[0]!.id).toBe("e-no-skill-fields-right-age");
    expect(rows.find((r) => r.id === "e-perfect-skill-wrong-age")!.scoreBreakdown.skillScore).toBe(
      100,
    );
    expect(rows.find((r) => r.id === "e-perfect-skill-wrong-age")!.scoreBreakdown.ageScore).toBe(
      35,
    );
    expect(rows.find((r) => r.id === "e-no-skill-fields-right-age")!.scoreBreakdown.skillScore).toBe(
      50,
    );
    expect(rows.find((r) => r.id === "e-no-skill-fields-right-age")!.scoreBreakdown.ageScore).toBe(
      100,
    );
  });

  it("when two children have different skills, ranks opportunity matching both areas above one matching a single area", async () => {
    const parent = stubParentWithTwoChildren();
    parent.children[0]!.skills = [stubChildSkill("sports", null)];
    parent.children[1]!.skills = [stubChildSkill("creative_arts", null)];

    const candidates: RecommendationCandidate[] = [
      baseSkillCompareCandidate("ev-partial", "event", "sports", null),
      baseSkillCompareCandidate("ev-full", "event", "sports", "creative_arts"),
    ];

    const repo = createRecommendationsRepositoryStub({ parent, candidates });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({ parentId: "stub-parent-2" });
    console.log('a1: ', {candidates, parent: JSON.stringify(parent), rows})
    expect(rows[0]!.id).toBe("ev-full");
    expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(rows.find((r) => r.id === "ev-partial")!.scoreBreakdown.skillScore).toBe(50);
  });

  it("club matching child skill via skillAreaVariant ranks above event with no skill fields", async () => {
    const parent = stubParentNatureChildAge7();
    parent.children[0]!.skills = [stubChildSkill("pottery_workshop", null)];

    const candidates: RecommendationCandidate[] = [
      baseSkillCompareCandidate("ev-plain", "event", null, null),
      baseSkillCompareCandidate("cl-variant", "club", null, "pottery_workshop"),
    ];

    const repo = createRecommendationsRepositoryStub({ parent, candidates });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({ parentId: "p1" });
    console.log('a1: ', {candidates, parent: JSON.stringify(parent), rows})
    expect(rows[0]!.id).toBe("cl-variant");
    expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(rows.find((r) => r.id === "ev-plain")!.scoreBreakdown.skillScore).toBe(50);
  });

  it("matches opportunity skillAreaSlug to child skill subcategory slug (granular skill slug may not match)", async () => {
    const parent = stubParentNatureChildAge7();
    parent.children[0]!.skills = [stubChildSkill("tiny_kickers", { slug: "sports" })];
    // Family slugs: tiny_kickers + sports → opp {sports} matches 1 of 2 → skillScore 50

    const candidates: RecommendationCandidate[] = [
      baseSkillCompareCandidate("ev-other", "event", "creative_arts", null),
      baseSkillCompareCandidate("ev-sports", "event", "sports", null),
    ];

    const repo = createRecommendationsRepositoryStub({ parent, candidates });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());
    const rows = await service.getRecommendationsForParent({ parentId: "p1" });

    expect(rows[0]!.id).toBe("ev-sports");
    expect(rows[0]!.scoreBreakdown.skillScore).toBe(50);
    expect(rows.find((r) => r.id === "ev-other")!.scoreBreakdown.skillScore).toBe(0);
  });

  it("filters out opportunities beyond parent searchRadius (haversine)", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNatureChildAge7({ searchRadius: 3 }),
      candidates: CANDIDATES_NEAR_VENUE_FAR_ROUTE,
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({
      parentId: "p1",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("v1");
  });

  it("returns one scored row per type when repository returns venue, event, club, and route", async () => {
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNatureChildAge7(),
      candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
    });
    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const rows = await service.getRecommendationsForParent({
      parentId: "p1",
    });

    expect(rows).toHaveLength(4);
    const types = new Set(rows.map((r) => r.type));
    expect(types).toEqual(new Set(["venue", "event", "club", "route"]));
    for (const r of rows) {
      expect(r.distanceMiles).not.toBeNull();
      expect(r.drivingDistanceMiles).toBeNull();
      expect(r.drivingDurationSeconds).toBeNull();
    }
  });

  it("passes all routable legs to driving cache hydrate (four opportunity types)", async () => {
    const { service: driving, getCalls } = createDrivingLegServiceRecording();
    const repo = createRecommendationsRepositoryStub({
      parent: stubParentNatureChildAge7(),
      candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
    });
    const svc = new RecommendationsService(repo, driving);

    await svc.getRecommendationsForParent({ parentId: "p1" });

    const calls = getCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0]!.parentId).toBe("p1");
    const legTypes = calls[0]!.legs.map((l) => l.type).sort();
    expect(legTypes).toEqual(["club", "event", "route", "venue"]);
    const ids = new Set(calls[0]!.legs.map((l) => l.id));
    expect(ids).toEqual(
      new Set(["opp-venue-hp3", "opp-event-hp4", "opp-club-wd17", "opp-route-lu1"]),
    );
  });

  describe("parent_opportunity_driving_legs merge (mocked DrivingLegService)", () => {
    const parent = stubParentNatureChildAge7({ id: "parent-driving" });

    it("merges drivingDistanceMiles and drivingDurationSeconds for every type when map has all legs", async () => {
      const drivingMap = new Map([
        [legKey("venue", "opp-venue-hp3"), { drivingDistanceMeters: 5000, drivingDurationSeconds: 600 }],
        [legKey("event", "opp-event-hp4"), { drivingDistanceMeters: 5100, drivingDurationSeconds: 610 }],
        [legKey("club", "opp-club-wd17"), { drivingDistanceMeters: 5200, drivingDurationSeconds: 620 }],
        [legKey("route", "opp-route-lu1"), { drivingDistanceMeters: 18000, drivingDurationSeconds: 1800 }],
      ]);

      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(drivingMap));

      const rows = await service.getRecommendationsForParent({
        parentId: parent.id,
      });

      expect(rows).toHaveLength(4);
      const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

      expect(byId["opp-venue-hp3"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(5000));
      expect(byId["opp-venue-hp3"]!.drivingDurationSeconds).toBe(600);
      expect(byId["opp-event-hp4"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(5100));
      expect(byId["opp-event-hp4"]!.drivingDurationSeconds).toBe(610);
      expect(byId["opp-club-wd17"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(5200));
      expect(byId["opp-club-wd17"]!.drivingDurationSeconds).toBe(620);
      expect(byId["opp-route-lu1"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(18000));
      expect(byId["opp-route-lu1"]!.drivingDurationSeconds).toBe(1800);
    });

    it("partial cache: only legs present in the map get driving fields; others stay null", async () => {
      const drivingMap = new Map([
        [legKey("venue", "opp-venue-hp3"), { drivingDistanceMeters: 1111, drivingDurationSeconds: 111 }],
        [legKey("route", "opp-route-lu1"), { drivingDistanceMeters: 2222, drivingDurationSeconds: 222 }],
      ]);

      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(drivingMap));

      const rows = await service.getRecommendationsForParent({
        parentId: parent.id,
      });

      const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
      expect(byId["opp-venue-hp3"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(1111));
      expect(byId["opp-route-lu1"]!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(2222));
      expect(byId["opp-event-hp4"]!.drivingDistanceMiles).toBeNull();
      expect(byId["opp-event-hp4"]!.drivingDurationSeconds).toBeNull();
      expect(byId["opp-club-wd17"]!.drivingDistanceMiles).toBeNull();
      expect(byId["opp-club-wd17"]!.drivingDurationSeconds).toBeNull();
    });

    it("empty driving map leaves all driving fields null", async () => {
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(new Map()));

      const rows = await service.getRecommendationsForParent({
        parentId: parent.id,
      });

      expect(rows).toHaveLength(4);
      for (const r of rows) {
        expect(r.drivingDistanceMiles).toBeNull();
        expect(r.drivingDurationSeconds).toBeNull();
      }
    });

  });
});
