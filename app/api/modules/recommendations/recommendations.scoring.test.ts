import { describe, it, expect } from "vitest";
import {
  RECOMMENDATION_WEIGHTS,
  childAgeMatchesSuitabilitySlugs,
  collectChildrenSkillSlugs,
  collectFamilyInterestSlugs,
  combineNearbyScore,
  combineWeightedScore,
  getAgeInYears,
  haversineDistanceMiles,
  parseInterestTagSlugs,
  matchesInterestSubCategorySlug,
  scoreAgeFromSuitabilitySlugs,
  scoreDistanceLinear,
  scoreInterestOverlap,
  scoreSkillOverlap,
} from "./scoring.js";

describe("RECOMMENDATION_WEIGHTS", () => {
  it("sums to 100% as decimals", () => {
    const sum =
      RECOMMENDATION_WEIGHTS.interests +
      RECOMMENDATION_WEIGHTS.skills +
      RECOMMENDATION_WEIGHTS.age +
      RECOMMENDATION_WEIGHTS.distance;
    expect(sum).toBe(1);
  });
});

describe("parseInterestTagSlugs", () => {
  it("splits on commas and lowercases", () => {
    const s = parseInterestTagSlugs("Nature_Exploration, animal_encounters");
    expect(s.has("nature_exploration")).toBe(true);
    expect(s.has("animal_encounters")).toBe(true);
  });
});

describe("matchesInterestSubCategorySlug", () => {
  it("matches a tag in interestTags", () => {
    expect(matchesInterestSubCategorySlug("woodland_walks, other", "x", "woodland_walks")).toBe(
      true,
    );
  });

  it("matches themeSlug when tags are empty", () => {
    expect(matchesInterestSubCategorySlug(null, "animal_encounters", "animal_encounters")).toBe(
      true,
    );
  });

  it("rejects when slug is absent", () => {
    expect(matchesInterestSubCategorySlug("a,b", "c", "missing")).toBe(false);
  });

  it("rejects blank slug", () => {
    expect(matchesInterestSubCategorySlug("a", "b", "   ")).toBe(false);
  });
});

describe("scoreInterestOverlap", () => {
  it("returns 50 when family has no interests", () => {
    expect(scoreInterestOverlap(new Set(), "a,b", "x")).toBe(50);
  });

  it("matches interestTags and themeSlug", () => {
    const family = new Set(["nature_exploration", "animal_encounters"]);
    const half = scoreInterestOverlap(family, "nature_exploration", "unused_theme");
    expect(half).toBe(50);
    const full = scoreInterestOverlap(
      family,
      "nature_exploration,animal_encounters",
      "extra",
    );
    expect(full).toBe(100);
  });
});

describe("childAgeMatchesSuitabilitySlugs", () => {
  it("treats empty slugs as all ages", () => {
    expect(childAgeMatchesSuitabilitySlugs(99, [])).toBe(true);
  });

  it("matches explicit age_N", () => {
    expect(childAgeMatchesSuitabilitySlugs(6, ["age_5", "age_6"])).toBe(true);
    expect(childAgeMatchesSuitabilitySlugs(4, ["age_5", "age_6"])).toBe(false);
  });

  it("handles age_13_plus and age_16_plus", () => {
    expect(childAgeMatchesSuitabilitySlugs(14, ["age_13_plus"])).toBe(true);
    expect(childAgeMatchesSuitabilitySlugs(15, ["age_16_plus"])).toBe(false);
    expect(childAgeMatchesSuitabilitySlugs(16, ["age_16_plus"])).toBe(true);
  });
});

describe("scoreAgeFromSuitabilitySlugs", () => {
  it("returns 100 when no slugs", () => {
    expect(scoreAgeFromSuitabilitySlugs([3, 7], [])).toBe(100);
  });

  it("averages child scores", () => {
    const s = ["age_5", "age_6", "age_7"];
    expect(scoreAgeFromSuitabilitySlugs([6, 6], s)).toBe(100);
    expect(scoreAgeFromSuitabilitySlugs([6, 20], s)).toBe(67.5);
  });
});

describe("scoreDistanceLinear", () => {
  it("is 100 at 0 mi and 0 at max", () => {
    expect(scoreDistanceLinear(0, 40)).toBe(100);
    expect(scoreDistanceLinear(40, 40)).toBe(0);
    expect(scoreDistanceLinear(20, 40)).toBe(50);
  });
});

describe("haversineDistanceMiles", () => {
  it("is ~0 for identical points", () => {
    expect(haversineDistanceMiles(51.773282, -0.434612, 51.773282, -0.434612)).toBe(0);
  });

  it("HP2 7DB to HP1 1BB is a few miles", () => {
    const mi = haversineDistanceMiles(51.773282, -0.434612, 51.751393, -0.471936);
    expect(mi).toBeGreaterThan(1);
    expect(mi).toBeLessThan(5);
  });
});

describe("getAgeInYears", () => {
  it("uses asOf when provided", () => {
    const dob = new Date("2018-01-10");
    expect(getAgeInYears(dob, new Date("2026-01-09"))).toBe(7);
    expect(getAgeInYears(dob, new Date("2026-01-11"))).toBe(8);
  });
});

describe("combineWeightedScore", () => {
  it("applies 25/25/25/25 weights", () => {
    expect(combineWeightedScore(100, 100, 100, 0)).toBe(75);
    expect(combineWeightedScore(100, 0, 100, 100)).toBe(75);
    expect(combineWeightedScore(0, 0, 0, 100)).toBe(25);
  });
});

describe("scoreSkillOverlap", () => {
  it("returns 50 when child has no skills", () => {
    expect(scoreSkillOverlap(new Set(), "sports", null)).toBe(50);
  });

  it("returns 50 when opportunity has no skill area fields", () => {
    expect(scoreSkillOverlap(new Set(["sports"]), null, null)).toBe(50);
  });

  it("matches skillAreaSlug and skillAreaVariant against child slugs", () => {
    expect(scoreSkillOverlap(new Set(["sports"]), "sports", null)).toBe(100);
    expect(scoreSkillOverlap(new Set(["a", "b"]), "a", "b")).toBe(100);
    expect(scoreSkillOverlap(new Set(["a", "b"]), "a", null)).toBe(50);
  });

  it("trims whitespace on opportunity skill fields", () => {
    expect(scoreSkillOverlap(new Set(["sports"]), "  Sports  ", null)).toBe(100);
    expect(scoreSkillOverlap(new Set(["painting"]), null, "  painting  ")).toBe(100);
  });

  it("returns 0 when no child slug matches opportunity skill fields", () => {
    expect(scoreSkillOverlap(new Set(["sports", "music"]), "creative_arts", "cooking")).toBe(0);
  });

  it("averages across union of child slugs when only some match", () => {
    // Two conceptual children merged: {sports, creative_arts}; opp only offers sports
    expect(scoreSkillOverlap(new Set(["sports", "creative_arts"]), "sports", null)).toBe(50);
  });

  it("counts a child skill slug and coarse bucket slug as separate tokens", () => {
    const family = new Set(["junior_swim", "sports"]);
    expect(scoreSkillOverlap(family, "sports", null)).toBe(50);
    expect(scoreSkillOverlap(family, "junior_swim", null)).toBe(50);
    expect(scoreSkillOverlap(family, "sports", "junior_swim")).toBe(100);
  });
});

describe("collectChildrenSkillSlugs", () => {
  it("merges skill slugs and linked subcategory slugs from all children", () => {
    const set = collectChildrenSkillSlugs({
      children: [
        {
          childAgeYears: 10,
          skills: [
            {
              slug: "Sprint_Run",
              minAge: null,
              maxAge: null,
              subCategory: { slug: "sports" },
            },
            { slug: "Pottery", minAge: null, maxAge: null, subCategory: null },
          ],
        },
        {
          childAgeYears: 8,
          skills: [
            { slug: "music_basics", minAge: null, maxAge: null, subCategory: { slug: "creative_arts" } },
          ],
        },
      ],
    });
    expect(set.has("sprint_run")).toBe(true);
    expect(set.has("sports")).toBe(true);
    expect(set.has("pottery")).toBe(true);
    expect(set.has("music_basics")).toBe(true);
    expect(set.has("creative_arts")).toBe(true);
  });

  it("returns empty set when all children have no skills", () => {
    expect(
      collectChildrenSkillSlugs({
        children: [
          { childAgeYears: 3, skills: [] },
          { childAgeYears: 5, skills: [] },
        ],
      }).size,
    ).toBe(0);
  });

  it("deduplicates when the same slug appears on multiple children", () => {
    const set = collectChildrenSkillSlugs({
      children: [
        { childAgeYears: 7, skills: [{ slug: "sports", minAge: null, maxAge: null, subCategory: null }] },
        { childAgeYears: 7, skills: [{ slug: "Sports", minAge: null, maxAge: null, subCategory: null }] },
      ],
    });
    expect(set.size).toBe(1);
    expect(set.has("sports")).toBe(true);
  });

  it("omits slugs when the child is outside the skill minAge / maxAge", () => {
    const set = collectChildrenSkillSlugs({
      children: [
        {
          childAgeYears: 5,
          skills: [
            {
              slug: "teen_clinic",
              minAge: 13,
              maxAge: null,
              subCategory: { slug: "sports" },
            },
            { slug: "soft_play", minAge: null, maxAge: 6, subCategory: null },
          ],
        },
      ],
    });
    expect(set.has("teen_clinic")).toBe(false);
    expect(set.has("sports")).toBe(false);
    expect(set.has("soft_play")).toBe(true);
  });
});

describe("combineNearbyScore", () => {
  it("uses 50% age and 50% distance (no interests)", () => {
    expect(combineNearbyScore(100, 100)).toBe(100);
    expect(combineNearbyScore(100, 0)).toBe(50);
    expect(combineNearbyScore(0, 100)).toBe(50);
    expect(combineNearbyScore(80, 60)).toBe(70);
  });
});

describe("collectFamilyInterestSlugs", () => {
  it("merges parent and children case-insensitively stored as lower", () => {
    const set = collectFamilyInterestSlugs({
      parentCategorySlugs: ["Nature_Exploration"],
      parentSubCategorySlugs: [],
      children: [
        {
          interestCategorySlugs: [],
          interestSubCategorySlugs: ["Animal_Encounters"],
        },
      ],
    });
    expect(set.has("nature_exploration")).toBe(true);
    expect(set.has("animal_encounters")).toBe(true);
  });
});
