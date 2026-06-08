import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createNoopDrivingLegService } from "../driving-leg.service.stub.js";
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
  CANDIDATES_NEAR_VENUE_FAR_ROUTE,
  createRecommendationsRepositoryStub,
  stubParentNatureChildAge7,
  stubParentNoChildren,
  stubParentWithOneChild,
  stubParentWithTwoChildren,
} from "./repository.stubs.js";

describe("RecommendationsService.getRecommendationsForParentAndChild", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STUB_TIME_ANCHOR_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when parent is missing", async () => {
    const { service } = makeRecommendationsTestService(null, []);
    await expect(
      service.getRecommendationsForParentAndChild("missing", "any-child"),
    ).rejects.toThrow("Parent not found.");
  });

  it("throws when parent has no children after narrowing", async () => {
    const { service } = makeRecommendationsTestService(stubParentNoChildren(), []);
    await expect(service.getRecommendationsForParentAndChild("p1", "c1")).rejects.toThrow(
      "No children registered",
    );
  });

  it("throws when childId does not match any child on the parent row", async () => {
    const parent = stubParentWithTwoChildren();
    const { service } = makeRecommendationsTestService(parent, []);
    await expect(
      service.getRecommendationsForParentAndChild(parent.id, "00000000-0000-4000-8000-000000000099"),
    ).rejects.toThrow("No children registered");
  });

  it("passes parentId and childId to the repository", async () => {
    const parent = stubParentWithTwoChildren();
    const { service, repo } = makeRecommendationsTestService(parent, CANDIDATES_NEAR_VENUE_FAR_ROUTE);
    const childId = parent.children[1]!.id;

    await service.getRecommendationsForParentAndChild(parent.id, childId);

    expect(repo.getParentForRecommendations).toHaveBeenCalledWith(parent.id, childId);
  });

  it("returns venue, event, club, and route for the school-age child when all four exist", async () => {
    const parent = stubParentWithTwoChildren();
    const schoolId = parent.children[1]!.id;
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_FOUR_OPPORTUNITY_TYPES);

    const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolId);

    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.type))).toEqual(new Set(["venue", "event", "club", "route"]));
  });

  it("sorts by score descending for single-child scope", async () => {
    const parent = stubParentWithTwoChildren();
    const schoolId = parent.children[1]!.id;
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_FOUR_OPPORTUNITY_TYPES);
    const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolId);
    const scores = rows.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("distance: nearer venue ranks above farther route for scoped child", async () => {
    const parent = stubParentNatureChildAge7();
    const childId = parent.children[0]!.id!;
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_NEAR_VENUE_FAR_ROUTE);
    const rows = await service.getRecommendationsForParentAndChild(parent.id, childId);

    expect(rows.map((r) => r.id)).toEqual(["v1", "r1"]);
    expect(rows[0]!.scoreBreakdown.distanceScore).toBeGreaterThan(rows[1]!.scoreBreakdown.distanceScore);
  });

  it("age + interest: school child scores higher than toddler on the same venue row", async () => {
    const parent = stubParentWithTwoChildren();
    const venueId = "opp-venue-hp3";
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_FOUR_OPPORTUNITY_TYPES);

    const schoolRows = await service.getRecommendationsForParentAndChild(
      parent.id,
      parent.children[1]!.id,
    );
    const toddlerRows = await service.getRecommendationsForParentAndChild(
      parent.id,
      parent.children[0]!.id,
    );

    const schoolVenue = schoolRows.find((r) => r.id === venueId)!;
    const toddlerVenue = toddlerRows.find((r) => r.id === venueId)!;

    expect(schoolVenue.score).toBeGreaterThan(toddlerVenue.score);
    expect(schoolVenue.scoreBreakdown.ageScore).toBeGreaterThan(toddlerVenue.scoreBreakdown.ageScore);
    expect(schoolVenue.scoreBreakdown.interestScore).toBeGreaterThan(
      toddlerVenue.scoreBreakdown.interestScore,
    );
  });

  it("skills: family sees partial event skill match; scoped child with only that skill sees full match", async () => {
    const parent = structuredClone(stubParentWithTwoChildren());
    parent.children[0]!.skills = [stubChildSkill("sports", null)];
    parent.children[1]!.skills = [stubChildSkill("creative_arts", null)];

    const candidates = [
      candidateAtHp1("ev-partial", "event", { skillAreaSlug: "sports", skillAreaVariant: null }),
    ];

    const { service } = makeRecommendationsTestService(parent, candidates);
    const familyRows = await service.getRecommendationsForFamily(parent.id);
    const toddlerRows = await service.getRecommendationsForParentAndChild(
      parent.id,
      parent.children[0]!.id,
    );

    expect(familyRows).toHaveLength(1);
    expect(toddlerRows).toHaveLength(1);
    expect(familyRows[0]!.scoreBreakdown.skillScore).toBe(50);
    expect(toddlerRows[0]!.scoreBreakdown.skillScore).toBe(100);
  });

  it("skills: scoped school child with sports gets 100 on event; scoped toddler without sports skills gets neutral 50", async () => {
    const parent = structuredClone(stubParentWithTwoChildren());
    parent.children[1]!.skills = [stubChildSkill("sports", null)];

    const candidates = [
      candidateAtHp1("e-sports", "event", { skillAreaSlug: "sports", skillAreaVariant: null }),
    ];
    const { service } = makeRecommendationsTestService(parent, candidates);

    const school = await service.getRecommendationsForParentAndChild(parent.id, parent.children[1]!.id);
    const toddler = await service.getRecommendationsForParentAndChild(parent.id, parent.children[0]!.id);

    expect(school).toHaveLength(1);
    expect(toddler).toHaveLength(1);
    expect(school[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(toddler[0]!.scoreBreakdown.skillScore).toBe(50);
  });

  it("club variant matches only when scoped child has that skill slug", async () => {
    const parent = structuredClone(stubParentWithTwoChildren());
    parent.children[1]!.skills = [stubChildSkill("pottery_workshop", null)];

    const candidates = [
      candidateAtHp1("cl-pottery", "club", {
        skillAreaSlug: null,
        skillAreaVariant: "pottery_workshop",
      }),
    ];
    const { service } = makeRecommendationsTestService(parent, candidates);

    const school = await service.getRecommendationsForParentAndChild(parent.id, parent.children[1]!.id);
    const toddler = await service.getRecommendationsForParentAndChild(parent.id, parent.children[0]!.id);

    expect(school).toHaveLength(1);
    expect(toddler).toHaveLength(1);
    expect(school[0]!.scoreBreakdown.skillScore).toBe(100);
    expect(toddler[0]!.scoreBreakdown.skillScore).toBe(50);
  });

  it("venue and route stay at skillScore 50 for scoped child with sports (no skill fields on row)", async () => {
    const parent = stubParentNatureChildAge7();
    const childId = parent.children[0]!.id!;
    parent.children[0]!.skills = [stubChildSkill("sports", null)];

    const candidates = [
      candidateAtHp1("v1", "venue"),
      candidateAtHp1("r1", "route", { themeSlug: "scenic_walks_and_wanders", ageSuitabilitySlugs: [] }),
    ];
    const { service } = makeRecommendationsTestService(parent, candidates);
    const rows = await service.getRecommendationsForParentAndChild(parent.id, childId);
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

    expect(rows).toHaveLength(2);
    expect(byId["v1"]!.scoreBreakdown.skillScore).toBe(50);
    expect(byId["r1"]!.scoreBreakdown.skillScore).toBe(50);
  });

  it("still narrows when repository returns all children for every childId query", async () => {
    const parent = stubParentWithTwoChildren();
    const repo = createRecommendationsRepositoryStub({
      parent,
      candidates: [
        candidateAtHp1("e-age", "event", {
          ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
        }),
      ],
    });
    vi.mocked(repo.getParentForRecommendations).mockImplementation(async () => structuredClone(parent));

    const service = new RecommendationsService(repo, createNoopDrivingLegService());

    const schoolRows = await service.getRecommendationsForParentAndChild(
      parent.id,
      parent.children[1]!.id,
    );
    expect(schoolRows[0]!.scoreBreakdown.ageScore).toBe(100);

    const toddlerRows = await service.getRecommendationsForParentAndChild(
      parent.id,
      parent.children[0]!.id,
    );
    expect(toddlerRows[0]!.scoreBreakdown.ageScore).toBe(35);
  });

  it("stubParentWithOneChild: scoped child matches family totals (documented return slice)", async () => {
    const parent = stubParentWithOneChild();
    const candidates = [
      candidateAtHp1("e-doc", "event", {
        ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
      }),
    ];
    const { service } = makeRecommendationsTestService(parent, candidates);
    const childId = parent.children[0]!.id;

    const family = await service.getRecommendationsForFamily(parent.id);
    const scoped = await service.getRecommendationsForParentAndChild(parent.id, childId);

    expect(family.map(recommendationReturnCore)).toEqual(scoped.map(recommendationReturnCore));
    expect(family.map(recommendationReturnCore)).toEqual([
      {
        type: "event",
        id: "e-doc",
        name: "e-doc",
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
      },
    ]);
  });

  it("stubParentNatureChildAge7: scoped stub-nature-child-7 matches getRecommendationsForParent", async () => {
    const parent = stubParentNatureChildAge7();
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_FOUR_OPPORTUNITY_TYPES);

    const fromParent = await service.getRecommendationsForParent({ parentId: parent.id });
    const scoped = await service.getRecommendationsForParentAndChild(parent.id, "stub-nature-child-7");

    expect(fromParent.map((r) => ({ id: r.id, score: r.score }))).toEqual(
      scoped.map((r) => ({ id: r.id, score: r.score })),
    );
  });

  it("searchRadius filters candidates for scoped child the same as family", async () => {
    const parent = stubParentNatureChildAge7({ searchRadius: 3 });
    const childId = parent.children[0]!.id!;
    const { service } = makeRecommendationsTestService(parent, CANDIDATES_NEAR_VENUE_FAR_ROUTE);
    const rows = await service.getRecommendationsForParentAndChild(parent.id, childId);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.id).toBe("v1");
  });

  describe("skills (scoped child vs opportunity skillAreaSlug / skillAreaVariant)", () => {
    const schoolChildId = () => stubParentWithTwoChildren().children[1]!.id!;

    it("club: skillAreaSlug alone matches child skill slug", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("chess_club", null)];

      const candidates = [
        candidateAtHp1("cl-chess", "club", {
          skillAreaSlug: "chess_club",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId());

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    });

    it("event: both skillAreaSlug and skillAreaVariant can match one child with two skill rows", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [
        stubChildSkill("sports", null),
        stubChildSkill("creative_arts", null),
      ];

      const candidates = [
        candidateAtHp1("ev-combo", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: "creative_arts",
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId());

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    });

    it("event: matches skill subcategory slug when granular child skill slug differs (partial overlap)", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("tiny_kickers", { slug: "sports" })];

      const candidates = [
        candidateAtHp1("ev-sports-area", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId());

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(50);
    });

    it("scoped child: skill excluded by minAge is not counted → neutral 50 on skill-bearing event", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("sports", null, 12, null)];

      const candidates = [
        candidateAtHp1("e-sports", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId());

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(50);
    });

    it("scoped child: no overlap between child skills and opportunity fields → skillScore 0", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("sports", null)];

      const candidates = [
        candidateAtHp1("e-creative", "event", {
          skillAreaSlug: "creative_arts",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId());

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(0);
    });

    it("ranks two same-location events by skill match when child only has one of the areas", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("sports", null)];

      const candidates = [
        candidateAtHp1("e-miss", "event", {
          skillAreaSlug: "creative_arts",
          skillAreaVariant: null,
        }),
        candidateAtHp1("e-hit", "event", {
          skillAreaSlug: "sports",
          skillAreaVariant: null,
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId());

      expect(rows).toHaveLength(2);
      expect(rows[0]!.id).toBe("e-hit");
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
      expect(rows[1]!.id).toBe("e-miss");
      expect(rows[1]!.scoreBreakdown.skillScore).toBe(0);
    });

    it("event skillAreaVariant-only row matches child skill slug (no primary slug)", async () => {
      const parent = structuredClone(stubParentWithTwoChildren());
      parent.children[1]!.skills = [stubChildSkill("robotics_lab", null)];

      const candidates = [
        candidateAtHp1("ev-robotics", "event", {
          skillAreaSlug: null,
          skillAreaVariant: "robotics_lab",
        }),
      ];
      const { service } = makeRecommendationsTestService(parent, candidates);
      const rows = await service.getRecommendationsForParentAndChild(parent.id, schoolChildId());

      expect(rows).toHaveLength(1);
      expect(rows[0]!.scoreBreakdown.skillScore).toBe(100);
    });

    it("stubParentWithOneChild: child skill + matching event returns skillScore 100 with documented core", async () => {
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
      const rows = await service.getRecommendationsForParentAndChild(
        parent.id,
        parent.children[0]!.id!,
      );

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
