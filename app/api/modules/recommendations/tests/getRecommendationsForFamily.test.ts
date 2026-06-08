import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDrivingLegServiceRecording } from "../driving-leg.service.stub.js";
import { RecommendationsService } from "../service.js";
import {
  candidateAtHp1,
  makeRecommendationsTestService,
  recommendationReturnCore,
  stubChildSkill,
  STUB_TIME_ANCHOR_ISO,
} from "./helpers.js";
import {
  CANDIDATES_FOUR_OPPORTUNITY_TYPES,
  CANDIDATES_INTEREST_VS_DISTANCE,
  CANDIDATES_NEAR_VENUE_FAR_ROUTE,
  createRecommendationsRepositoryStub,
  stubParentLearningCuriosityChildAge7,
  stubParentNatureChildAge7,
  stubParentNoChildren,
  stubParentWithOneChild,
  stubParentWithTwoChildren,
} from "./repository.stubs.js";

describe("RecommendationsService.getRecommendationsForFamily", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STUB_TIME_ANCHOR_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when parent is missing", async () => {
    const { service, repo } = makeRecommendationsTestService(null, []);
    await expect(service.getRecommendationsForFamily("missing")).rejects.toThrow("Parent not found.");
    expect(vi.mocked(repo.getOpportunityCandidates)).not.toHaveBeenCalled();
  });

  it("throws when parent has no children", async () => {
    const { service } = makeRecommendationsTestService(stubParentNoChildren(), []);
    await expect(service.getRecommendationsForFamily("p1")).rejects.toThrow("No children registered");
  });

  it("loads parent with no child filter (repository second argument undefined)", async () => {
    const parent = stubParentNatureChildAge7();
    const { service, repo } = makeRecommendationsTestService(parent, CANDIDATES_NEAR_VENUE_FAR_ROUTE);
    await service.getRecommendationsForFamily(parent.id);
    expect(repo.getParentForRecommendations).toHaveBeenCalledWith(parent.id, undefined);
  });

  it("returns venue, event, club, and route when the stub lists all four types", async () => {
    const parent = stubParentNatureChildAge7();
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_FOUR_OPPORTUNITY_TYPES);
    const rows = await service.getRecommendationsForFamily(parent.id);

    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.type))).toEqual(new Set(["venue", "event", "club", "route"]));
    const ids = new Set(rows.map((r) => r.id));
    expect(ids).toEqual(
      new Set(["opp-venue-hp3", "opp-event-hp4", "opp-club-wd17", "opp-route-lu1"]),
    );
  });

  it("sorts results by total score descending", async () => {
    const parent = stubParentNatureChildAge7();
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_FOUR_OPPORTUNITY_TYPES);
    const rows = await service.getRecommendationsForFamily(parent.id);
    const scores = rows.map((r) => r.score);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("passes one routable leg per candidate type to the driving-leg service", async () => {
    const { service: driving, getCalls } = createDrivingLegServiceRecording();
    const parent = stubParentNatureChildAge7();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: CANDIDATES_FOUR_OPPORTUNITY_TYPES,
    });
    const service = new RecommendationsService(repo, driving);

    await service.getRecommendationsForFamily(parent.id);

    const calls = getCalls();
    expect(calls).toHaveLength(1);
    expect(new Set(calls[0]!.legs.map((l) => l.type))).toEqual(
      new Set(["venue", "event", "club", "route"]),
    );
  });

  it("distance: nearer venue ranks above farther route when interests and age fit", async () => {
    const parent = stubParentNatureChildAge7();
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_NEAR_VENUE_FAR_ROUTE);
    const rows = await service.getRecommendationsForFamily(parent.id);

    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.id)).toEqual(["v1", "r1"]);
    expect(rows[0]!.score).toBeGreaterThan(rows[1]!.score);
    expect(rows[0]!.scoreBreakdown.distanceScore).toBeGreaterThan(rows[1]!.scoreBreakdown.distanceScore);
  });

  it("interest: stronger thematic match can outrank closer row with weak match", async () => {
    const parent = stubParentLearningCuriosityChildAge7();
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_INTEREST_VS_DISTANCE);
    const rows = await service.getRecommendationsForFamily(parent.id);

    expect(rows).toHaveLength(2);
    expect(rows[0]!.id).toBe("far-interest-match");
    expect(rows[0]!.scoreBreakdown.interestScore).toBeGreaterThan(
      rows.find((r) => r.id === "near-no-interest-match")!.scoreBreakdown.interestScore,
    );
  });

  it("searchRadius excludes opportunities beyond haversine distance (family)", async () => {
    const parent = stubParentNatureChildAge7({ searchRadius: 3 });
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_NEAR_VENUE_FAR_ROUTE);
    const rows = await service.getRecommendationsForFamily(parent.id);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("v1");
  });

  it("skills (family): event matching both children skill areas ranks above event matching one", async () => {
    const parent = structuredClone(stubParentWithTwoChildren());
    parent.children[0]!.skills = [stubChildSkill("sports", null)];
    parent.children[1]!.skills = [stubChildSkill("creative_arts", null)];

    const candidates = [
      candidateAtHp1("ev-partial", "event", { skillAreaSlug: "sports", skillAreaVariant: null }),
      candidateAtHp1("ev-full", "event", {
        skillAreaSlug: "sports",
        skillAreaVariant: "creative_arts",
      }),
    ];

    const { service } = makeRecommendationsTestService(parent, candidates);
    const rows = await service.getRecommendationsForFamily(parent.id);

    expect(rows).toHaveLength(2);
    expect(rows[0]!.id).toBe("ev-full");
    expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(rows.find((r) => r.id === "ev-partial")!.scoreBreakdown.skillScore).toBe(50);
  });

  it("skills (family): club skillAreaVariant can beat plain venue when child skill matches variant", async () => {
    const parent = stubParentNatureChildAge7();
    parent.children[0]!.skills = [stubChildSkill("pottery_workshop", null)];

    const candidates = [
      candidateAtHp1("v-plain", "venue"),
      candidateAtHp1("cl-variant", "club", {
        skillAreaSlug: null,
        skillAreaVariant: "pottery_workshop",
      }),
    ];

    const { service } = makeRecommendationsTestService(parent, candidates);
    const rows = await service.getRecommendationsForFamily(parent.id);

    expect(rows).toHaveLength(2);
    expect(rows[0]!.id).toBe("cl-variant");
    expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(rows.find((r) => r.id === "v-plain")!.scoreBreakdown.skillScore).toBe(50);
  });

  it("venue and route keep neutral skill score (50) while event uses skillAreaSlug", async () => {
    const parent = stubParentNatureChildAge7();
    parent.children[0]!.skills = [stubChildSkill("sports", null)];

    const candidates = [
      candidateAtHp1("v1", "venue"),
      candidateAtHp1("e1", "event", { skillAreaSlug: "sports", skillAreaVariant: null }),
      candidateAtHp1("r1", "route", { themeSlug: "scenic_walks_and_wanders", ageSuitabilitySlugs: [] }),
    ];

    const { service } = makeRecommendationsTestService(parent, candidates);
    const rows = await service.getRecommendationsForFamily(parent.id);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

    expect(rows).toHaveLength(3);
    expect(byId["v1"]!.scoreBreakdown.skillScore).toBe(50);
    expect(byId["r1"]!.scoreBreakdown.skillScore).toBe(50);
    expect(byId["e1"]!.scoreBreakdown.skillScore).toBe(100);
  });

  it("age: averages suitability across all children for family scope", async () => {
    const parent = stubParentWithTwoChildren();
    const candidates = [
      candidateAtHp1("e-school-ages", "event", {
        ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
      }),
    ];
    const { service } = makeRecommendationsTestService(parent, candidates);
    const rows = await service.getRecommendationsForFamily(parent.id);

    expect(rows).toHaveLength(1);
    expect(rows.map(recommendationReturnCore)).toEqual([
      {
        type: "event",
        id: "e-school-ages",
        name: "e-school-ages",
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
      },
    ]);
  });

  it("interest contribution differs for two-child family vs single-interest parent only", async () => {
    const two = stubParentWithTwoChildren();
    const { service } = makeRecommendationsTestService(two, [
      candidateAtHp1("shared", "venue", { interestTags: "nature_exploration", themeSlug: "animal_encounters" }),
    ]);
    const familyRows = await service.getRecommendationsForFamily(two.id);

    const one = stubParentNatureChildAge7({ id: "p-single" });
    const { service: svc2 } = makeRecommendationsTestService(one, [
      candidateAtHp1("shared", "venue", { interestTags: "nature_exploration", themeSlug: "animal_encounters" }),
    ]);
    const singleChildRows = await svc2.getRecommendationsForFamily(one.id);

    expect(familyRows).toHaveLength(1);
    expect(singleChildRows).toHaveLength(1);
    expect(familyRows[0]!.scoreBreakdown.interestScore).toBeLessThan(
      singleChildRows[0]!.scoreBreakdown.interestScore,
    );
  });

  describe("skills (family aggregate vs opportunity skillAreaSlug / skillAreaVariant)", () => {
    it("club: skillAreaSlug matches when only one child carries that skill (aggregate)", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("chess_club", null)];

      const candidates = [
        candidateAtHp1("cl-chess", "club", {
          skillAreaSlug: "chess_club",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    });

    it("event: single row with slug + variant matches merged skills from two children", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[0]!.skills = [stubChildSkill("sports", null)];
      parent.children[1]!.skills = [stubChildSkill("creative_arts", null)];

      const candidates = [
        candidateAtHp1("ev-combo", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: "creative_arts",
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    });

    it("event: subcategory slug partial match when one child has granular skill + sports subcategory", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("tiny_kickers", { slug: "sports" })];

      const candidates = [
        candidateAtHp1("ev-sports-area", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(50);
    });

    it("family: skill excluded by minAge leaves neutral 50 on skill-bearing event", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("sports", null, 12, null)];

      const candidates = [
        candidateAtHp1("e-sports", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(50);
    });

    it("family: no overlap between merged child skills and opportunity → skillScore 0", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("sports", null)];

      const candidates = [
        candidateAtHp1("e-creative", "event", {
          skillAreaSlug: "creative_arts",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(0);
    });

    it("ranks two events: full slug+variant match beats unrelated skill area", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[0]!.skills = [stubChildSkill("sports", null)];
      parent.children[1]!.skills = [stubChildSkill("creative_arts", null)];

      const candidates = [
        candidateAtHp1("e-miss", "event", {
          skillAreaSlug: "swimming",
          skillAreaVariant: null,
        }),
        candidateAtHp1("e-hit", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: "creative_arts",
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(2);
      expect(rows[0]!.id).toBe("e-hit");
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
      expect(rows[1]!.id).toBe("e-miss");
      expect(rows[1]!.scoreBreakdown.skillScore).toBe(0);
    });

    it("event skillAreaVariant-only matches merged family skill slug", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("robotics_lab", null)];

      const candidates = [
        candidateAtHp1("ev-robotics", "event", {
          skillAreaSlug: null,
          skillAreaVariant: "robotics_lab",
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    });

    it("stubParentWithOneChild: child skill + matching event (documented return slice)", async () => {
      const parent = stubParentWithOneChild();
      parent.children[0]!.skills = [stubChildSkill("sports", null)];

      const candidates = [
        candidateAtHp1("e-skill-doc", "event", {
          ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
          skillAreaSlug: "sports",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForFamily(parent.id);

      expect(rows).toHaveLength(1);
      expect(rows.map(recommendationReturnCore)).toEqual([
        {
          type: "event",
          id: "e-skill-doc",
          name: "e-skill-doc",
          distanceMiles: 2.2,
          drivingDistanceMiles: null,
          drivingDurationSeconds: null,
          score: 92,
          scoreBreakdown: {
            interestScore: 67,
            skillScore: 100,
            ageScore: 100,
            distanceScore: 100,
            total: 92,
          },
        },
      ]);
    });
  });
});
