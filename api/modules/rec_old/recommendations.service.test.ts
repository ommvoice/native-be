import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Opportunity } from "@prisma/client";
import {
  RecommendationsService,
  scoreAge,
  scoreDistance,
  scoreCost,
  scoreEffort,
  scoreAccessibility,
  haversineDistanceMiles,
  getAgeInYears,
} from "./recommendations.service.js";
import type { RecommendationsRepository } from "./recommendations.repository.js";

// ---------------------------------------------------------------------------
// Helpers to build stub data
// ---------------------------------------------------------------------------

function yearsAgo(years: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

function makeChild(ageYears: number, name = "Child") {
  return {
    id: crypto.randomUUID(),
    nameOrNickName: name,
    dateOfBirth: yearsAgo(ageYears),
    createdAt: new Date(),
    updatedAt: new Date(),
    parentId: "parent-1",
  };
}

function makeParent(
  childrenAges: number[],
  options?: { searchRadius?: number },
) {
  const searchRadius = options?.searchRadius ?? 100;
  return {
    id: "parent-1",
    postCode: "EX4 3PU",
    firstNameOrNickName: "Sarah",
    latitude: "50.7236",
    longitude: "-3.5275",
    searchRadius,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-1",
    children: childrenAges.map((age, i) => makeChild(age, `Child${i + 1}`)),
  };
}

const BASE_OPP: Opportunity = {
  id: "opp-base",
  providerId: "prov-1",
  name: "Base Opportunity",
  description: "A test opportunity",
  category: "adventure_play",
  subcategory: null,
  minAge: 2,
  maxAge: 12,
  suitableFor: ["Buggies", "Dogs"],
  accessibilityFeatures: [],
  address: "Test Address",
  city: "Exeter",
  postcode: "EX4 3PU",
  latitude: 50.723,
  longitude: -3.529,
  openingHours: null,
  isFree: true,
  priceInfo: null,
  entryCost: "Free",
  websiteUrl: null,
  imageUrls: [],
  isActive: true,
  oppType: "activity_venue",
  oppClassification: "Fixed / Static",
  oppCategory: "adventure_play",
  facilities: ["toilets", "parking"],
  parkingProvision: ["free parking nearby"],
  terrain: [],
  activityEffortTag: "energy_burner",
  estimatedVisitDuration: "1-3 hours",
  difficultyRating: "easy",
  interestCategory: "Adventure & Outdoor Movement",
  opportunityThemeVariant: "Woodland Adventure Playground",
  routeDistance: null,
  routeType: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeOpp(overrides: Partial<Opportunity>): Opportunity {
  return { ...BASE_OPP, ...overrides };
}

// --- Stub opportunities modelled after real CSV data ---

const CASTLE_PARK = makeOpp({
  id: "castle-park",
  name: "Castle Park Adventure Playground",
  category: "adventure_play",
  minAge: 2,
  maxAge: 12,
  latitude: 50.723,
  longitude: -3.529,
  isFree: true,
  suitableFor: ["Buggies", "Dogs"],
  activityEffortTag: "energy_burner",
  interestCategory: "Adventure & Outdoor Movement",
});

const GREENDALE_FARM = makeOpp({
  id: "greendale-farm",
  name: "Greendale Farm Shop & Café",
  category: "animal_encounters",
  minAge: 0,
  maxAge: 12,
  latitude: 50.7234,
  longitude: -3.4156,
  isFree: false,
  entryCost: "~£18 per family",
  suitableFor: ["Buggies", "Wheelchairs"],
  activityEffortTag: "low_effort",
  interestCategory: "Animals & Farm Life",
});

const RAMM_MUSEUM = makeOpp({
  id: "ramm-museum",
  name: "RAMM Museum",
  category: "interactive_learning",
  minAge: 3,
  maxAge: 16,
  latitude: 50.7244,
  longitude: -3.5339,
  isFree: true,
  suitableFor: ["Buggies", "Wheelchairs"],
  activityEffortTag: "low_effort",
  interestCategory: "Learning Through Doing",
});

const PUFFIN_PARK = makeOpp({
  id: "puffin-park",
  name: "Puffin Park Soft Play",
  category: "soft_play",
  minAge: 0,
  maxAge: 10,
  latitude: 50.625,
  longitude: -3.398,
  isFree: false,
  entryCost: "~£13 for 2 children",
  suitableFor: ["Buggies", "Wheelchairs"],
  activityEffortTag: "energy_burner",
  interestCategory: "Indoor Energy Release",
});

const WOODBURY_WALK = makeOpp({
  id: "woodbury-walk",
  name: "Woodbury Castle Heathland Walk",
  category: "scenic_walks",
  minAge: null,
  maxAge: null,
  latitude: 50.669,
  longitude: -3.372,
  isFree: true,
  suitableFor: ["Dogs"],
  activityEffortTag: "new_adventure",
  difficultyRating: "moderate",
  interestCategory: "Nature & Outdoor Discovery",
  oppType: "route",
});

const ESCOT_PARK = makeOpp({
  id: "escot-park",
  name: "Escot Park & Gardens",
  category: "animal_encounters",
  minAge: 0,
  maxAge: 16,
  latitude: 50.758,
  longitude: -3.289,
  isFree: false,
  entryCost: "~£30 per family",
  suitableFor: ["Buggies", "Dogs"],
  activityEffortTag: "special_day_out",
  interestCategory: "Animals & Farm Life",
});

const ALL_OPPORTUNITIES = [
  CASTLE_PARK,
  GREENDALE_FARM,
  RAMM_MUSEUM,
  PUFFIN_PARK,
  WOODBURY_WALK,
  ESCOT_PARK,
];

// Exeter latitude (matches stub parent lat; longitude comes from parent profile in service)
const EXETER_LAT = 50.7236;

// ---------------------------------------------------------------------------
// Unit tests: individual scoring functions
// ---------------------------------------------------------------------------

describe("scoreAge", () => {
  it("returns 100 when child age is within range", () => {
    expect(scoreAge(CASTLE_PARK, [5])).toBe(100);
    expect(scoreAge(CASTLE_PARK, [2])).toBe(100);
    expect(scoreAge(CASTLE_PARK, [12])).toBe(100);
  });

  it("returns 100 when opportunity has no age limits (routes)", () => {
    expect(scoreAge(WOODBURY_WALK, [2])).toBe(100);
    expect(scoreAge(WOODBURY_WALK, [15])).toBe(100);
  });

  it("penalises when child is outside the age range", () => {
    const score = scoreAge(CASTLE_PARK, [15]);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("averages scores across multiple children", () => {
    // One child in range (age 5) = 100, one outside (age 15, 3 years over max 12) = 10
    const score = scoreAge(CASTLE_PARK, [5, 15]);
    expect(score).toBe(55); // (100 + 10) / 2
  });

  it("gives partial credit for being just 1 year outside range", () => {
    // Age 13, max is 12, distance = 1 => penalty = 30 => score = 70
    const score = scoreAge(CASTLE_PARK, [13]);
    expect(score).toBe(70);
  });

  it("gives zero for being far outside the range", () => {
    // Age 20, max is 12, distance = 8 => penalty = min(240, 100) = 100 => score = 0
    expect(scoreAge(CASTLE_PARK, [20])).toBe(0);
  });
});

describe("scoreDistance (miles)", () => {
  it("returns 100 for distance of 0", () => {
    expect(scoreDistance(0, 50)).toBe(100);
  });

  it("returns 0 when max radius is 0 or negative", () => {
    expect(scoreDistance(0, 0)).toBe(0);
    expect(scoreDistance(5, -1)).toBe(0);
  });

  it("returns 0 when at maxDistance", () => {
    expect(scoreDistance(50, 50)).toBe(0);
  });

  it("returns 50 at halfway point", () => {
    expect(scoreDistance(25, 50)).toBe(50);
  });

  it("scales linearly", () => {
    expect(scoreDistance(10, 50)).toBeCloseTo(80);
    expect(scoreDistance(40, 50)).toBeCloseTo(20);
  });
});

describe("scoreCost", () => {
  it("returns 100 for free opportunities", () => {
    expect(scoreCost(CASTLE_PARK, false)).toBe(100);
    expect(scoreCost(CASTLE_PARK, true)).toBe(100);
  });

  it("returns 60 for paid when user does not prefer free", () => {
    expect(scoreCost(GREENDALE_FARM, false)).toBe(60);
  });

  it("returns 30 for paid when user prefers free", () => {
    expect(scoreCost(GREENDALE_FARM, true)).toBe(30);
  });
});

describe("scoreEffort", () => {
  it("favours low_effort for toddlers (under 5)", () => {
    expect(scoreEffort(GREENDALE_FARM, [2])).toBe(100); // low_effort + under5
    expect(scoreEffort(CASTLE_PARK, [2])).toBe(50); // energy_burner + under5
  });

  it("favours energy_burner for ages 5-10", () => {
    expect(scoreEffort(CASTLE_PARK, [7])).toBe(100); // energy_burner + age5to10
    expect(scoreEffort(GREENDALE_FARM, [7])).toBe(70); // low_effort + age5to10
  });

  it("favours special_day_out for over 10s", () => {
    expect(scoreEffort(ESCOT_PARK, [12])).toBe(100); // special_day_out + over10
  });

  it("returns 70 default when no effort tag is set", () => {
    const noTag = makeOpp({ activityEffortTag: null });
    expect(scoreEffort(noTag, [5])).toBe(70);
  });

  it("uses youngest child's age for mixed-age families", () => {
    // youngest = 3 (under5 group), energy_burner scores 50 for under5
    expect(scoreEffort(CASTLE_PARK, [3, 8, 11])).toBe(50);
  });
});

describe("scoreAccessibility", () => {
  it("returns 100 when buggy-friendly and family needs buggy", () => {
    expect(scoreAccessibility(CASTLE_PARK, true)).toBe(100);
  });

  it("returns 30 when not buggy-friendly but family needs buggy", () => {
    expect(scoreAccessibility(WOODBURY_WALK, true)).toBe(30);
  });

  it("returns 80 when buggy-friendly but family does not need one", () => {
    expect(scoreAccessibility(CASTLE_PARK, false)).toBe(80);
  });

  it("returns 70 when not buggy-friendly and family does not need one", () => {
    expect(scoreAccessibility(WOODBURY_WALK, false)).toBe(70);
  });
});

describe("haversineDistanceMiles", () => {
  it("returns 0 for same point", () => {
    expect(haversineDistanceMiles(50.7236, -3.5275, 50.7236, -3.5275)).toBe(0);
  });

  it("calculates plausible miles between two Devon points (~9–11 mi vs old ~12–18 km)", () => {
    const dist = haversineDistanceMiles(50.7236, -3.5275, 50.625, -3.398);
    expect(dist).toBeGreaterThan(7);
    expect(dist).toBeLessThan(12);
  });

  it("is symmetric", () => {
    const ab = haversineDistanceMiles(50.7236, -3.5275, 50.625, -3.398);
    const ba = haversineDistanceMiles(50.625, -3.398, 50.7236, -3.5275);
    expect(ab).toBeCloseTo(ba, 10);
  });
});

describe("getAgeInYears", () => {
  it("returns correct age for a child born 5 years ago", () => {
    expect(getAgeInYears(yearsAgo(5))).toBe(5);
  });

  it("returns 0 for a newborn", () => {
    expect(getAgeInYears(new Date())).toBe(0);
  });

  it("handles birthday not yet reached this year", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 3);
    dob.setMonth(dob.getMonth() + 1); // birthday is next month
    expect(getAgeInYears(dob)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Integration tests: full service with mocked repository
// ---------------------------------------------------------------------------

describe("RecommendationsService", () => {
  let service: RecommendationsService;
  let mockRepo: {
    getActiveOpportunities: ReturnType<typeof vi.fn>;
    getParentWithChildren: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      getActiveOpportunities: vi.fn().mockResolvedValue(ALL_OPPORTUNITIES),
      getParentWithChildren: vi.fn(),
    };
    service = new RecommendationsService(
      mockRepo as unknown as RecommendationsRepository,
    );
  });

  it("throws when parent is not found", async () => {
    mockRepo.getParentWithChildren.mockResolvedValue(null);

    await expect(
      service.getRecommendations({
        parentId: "unknown",
        latitude: EXETER_LAT,
      }),
    ).rejects.toThrow("Parent not found.");
  });

  it("throws when parent has no children", async () => {
    mockRepo.getParentWithChildren.mockResolvedValue(makeParent([]));

    await expect(
      service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      }),
    ).rejects.toThrow("No children registered");
  });

  describe("family with a toddler (age 2)", () => {
    beforeEach(() => {
      mockRepo.getParentWithChildren.mockResolvedValue(makeParent([2]));
    });

    it("ranks buggy-friendly, low-effort, free parks highest", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      expect(results.length).toBeGreaterThan(0);
      // Castle Park is very close, free, buggy-friendly, age 2-12
      const castlePark = results.find((r) => r.id === "castle-park")!;
      expect(castlePark).toBeDefined();
      expect(castlePark.scoreBreakdown.ageScore).toBe(100);
      expect(castlePark.scoreBreakdown.costScore).toBe(100);
      expect(castlePark.scoreBreakdown.accessibilityScore).toBe(100);
    });

    it("penalises non-buggy-friendly walks", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      const woodbury = results.find((r) => r.id === "woodbury-walk")!;
      expect(woodbury).toBeDefined();
      // Woodbury doesn't support buggies
      expect(woodbury.scoreBreakdown.accessibilityScore).toBe(30);
    });

    it("respects parent searchRadius in miles for filtering", async () => {
      mockRepo.getParentWithChildren.mockResolvedValue(makeParent([2], { searchRadius: 1 }));

      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      for (const r of results) {
        expect(r.distanceMiles).toBeLessThanOrEqual(1.01);
      }
    });
  });

  describe("family with an older child (age 8)", () => {
    beforeEach(() => {
      mockRepo.getParentWithChildren.mockResolvedValue(makeParent([8]));
    });

    it("ranks energy_burner activities higher", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      const castlePark = results.find((r) => r.id === "castle-park")!;
      // energy_burner + age5to10 = 100
      expect(castlePark.scoreBreakdown.effortScore).toBe(100);

      const farm = results.find((r) => r.id === "greendale-farm")!;
      // low_effort + age5to10 = 70
      expect(farm.scoreBreakdown.effortScore).toBe(70);
    });

    it("does not need buggy, so non-buggy places score normally", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      const woodbury = results.find((r) => r.id === "woodbury-walk")!;
      expect(woodbury.scoreBreakdown.accessibilityScore).toBe(70);
    });
  });

  describe("mixed-age family (ages 2 and 10)", () => {
    beforeEach(() => {
      mockRepo.getParentWithChildren.mockResolvedValue(makeParent([2, 10]));
    });

    it("averages age scores across children", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      // Puffin Park: minAge 0, maxAge 10 — both children fit
      const puffin = results.find((r) => r.id === "puffin-park")!;
      expect(puffin.scoreBreakdown.ageScore).toBe(100);

      // Castle Park: minAge 2, maxAge 12 — both children fit
      const castle = results.find((r) => r.id === "castle-park")!;
      expect(castle.scoreBreakdown.ageScore).toBe(100);
    });

    it("still needs buggy (youngest is 2)", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      const woodbury = results.find((r) => r.id === "woodbury-walk")!;
      expect(woodbury.scoreBreakdown.accessibilityScore).toBe(30);
    });
  });

  describe("category filtering", () => {
    beforeEach(() => {
      mockRepo.getParentWithChildren.mockResolvedValue(makeParent([5]));
    });

    it("filters to only animal_encounters when requested", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
        categories: ["animal_encounters"],
      });

      for (const r of results) {
        expect(r.category).toBe("animal_encounters");
      }
      expect(results.length).toBe(2); // Greendale Farm + Escot Park
    });

    it("supports multiple category filters", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
        categories: ["animal_encounters", "soft_play"],
      });

      expect(results.length).toBe(3); // Greendale, Escot, Puffin
    });
  });

  describe("results are sorted by score descending", () => {
    beforeEach(() => {
      mockRepo.getParentWithChildren.mockResolvedValue(makeParent([5]));
    });

    it("highest scored opportunity comes first", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
      }
    });
  });

  describe("skips opportunities without coordinates", () => {
    beforeEach(() => {
      mockRepo.getParentWithChildren.mockResolvedValue(makeParent([5]));
      mockRepo.getActiveOpportunities.mockResolvedValue([
        ...ALL_OPPORTUNITIES,
        makeOpp({ id: "no-coords", latitude: null, longitude: null }),
      ]);
    });

    it("excludes opportunities with null lat/lng", async () => {
      const results = await service.getRecommendations({
        parentId: "parent-1",
        latitude: EXETER_LAT,
      });

      expect(results.find((r) => r.id === "no-coords")).toBeUndefined();
    });
  });
});
