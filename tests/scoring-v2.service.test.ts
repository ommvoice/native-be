import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from "vitest";

const getWeatherByPostcodeMock = vi.fn();
vi.mock("../app/services/weather.service.js", () => ({
  getWeatherByPostcode: (...args: unknown[]) => getWeatherByPostcodeMock(...args),
}));

import {
  scoreInterestOverlap,
  scoreTagOverlap,
  scoreAge,
  buildFamilyThemeSlugWeights,
  scoreInterestThemeWeighted,
  buildChildTagWeights,
  scoreInterestTagsWeighted,
  scoreSchedule,
  mapWeatherToSuitabilitySlugs,
  scoreWeatherSuitability,
  getCachedWeatherSuitabilitySlugs,
  scoreDistance,
  combineWeighted,
  rankWithShuffle,
  getInitialScore,
} from "../app/services/scoring-v2.service.js";
import type { Score } from "../app/dtos/recommendation.dto.js";
import { getAgeInYears } from "../app/services/scoring.service.js";
import { RecommendationV2Repository } from "../app/repositories/recommendation-v2.repository.js";
import params from "../app/shared/assets/params.json" with { type: "json" };
import venues from "../app/shared/assets/venues.json" with { type: "json" };

// Same fixture as scripts/test-recommendations.ts / tests/recommendation-v2.getItemsWithScore.test.ts —
// a captured real parent+children payload, exercised here directly against the scoring functions.
const familyThemeSlugs = new Set(
  params.narrowed.interestSubCategories.map((x) => x.slug.trim().toLowerCase()),
);
const childTags = [...new Set(params.narrowed.children.flatMap((c) => c.interestTags ?? []))];
const childAges = params.narrowed.children.map((c) => getAgeInYears(new Date(c.dateOfBirth)));

describe("scoring-v2.service", () => {
  describe("scoreInterestOverlap", () => {
    it("scores 0 when neither themeSlug nor themeVariantSlug is one of the family's slugs", () => {
      expect(scoreInterestOverlap(familyThemeSlugs, "not_a_real_theme", "also_not_real")).toBe(0);
    });

    it("scores matched/total * 100 when exactly one of the family's slugs matches", () => {
      const score = scoreInterestOverlap(familyThemeSlugs, "scenic_walks", "not_a_real_variant");
      expect(score).toBeCloseTo((1 / familyThemeSlugs.size) * 100);
    });

    it("counts both themeSlug and themeVariantSlug matches", () => {
      const score = scoreInterestOverlap(familyThemeSlugs, "scenic_walks", "green_spaces");
      expect(score).toBeCloseTo((2 / familyThemeSlugs.size) * 100);
    });

    it("matches case-insensitively", () => {
      const score = scoreInterestOverlap(familyThemeSlugs, "SCENIC_WALKS", "");
      expect(score).toBeCloseTo((1 / familyThemeSlugs.size) * 100);
    });

    it("defaults to 50 (neutral) when the family has no interest slugs at all", () => {
      expect(scoreInterestOverlap(new Set(), "scenic_walks", "green_spaces")).toBe(50);
    });
  });

  describe("buildFamilyThemeSlugWeights / scoreInterestThemeWeighted", () => {
    const familyThemeSlugWeights = buildFamilyThemeSlugWeights({
      parentSlugs:   params.narrowed.interestSubCategories.map((x) => x.slug),
      childrenSlugs: params.narrowed.children.map((c) => c.interestSubCategories.map((x) => x.slug)),
    });

    it("weights a slug shared by the parent and all 3 children as 4", () => {
      expect(familyThemeSlugWeights.get("water_fun")).toBe(4);
    });

    it("weights a slug shared by the parent and 1 child as 2", () => {
      expect(familyThemeSlugWeights.get("scenic_walks")).toBe(2);
    });

    it("weights a slug only 1 child has as 1", () => {
      expect(familyThemeSlugWeights.get("big_day_out")).toBe(1);
    });

    it("scores a widely-shared theme higher than a narrowly-shared one", () => {
      const widelyShared   = scoreInterestThemeWeighted(familyThemeSlugWeights, "water_fun", "not_a_real_variant");
      const narrowlyShared = scoreInterestThemeWeighted(familyThemeSlugWeights, "big_day_out", "not_a_real_variant");
      expect(widelyShared).toBeGreaterThan(narrowlyShared);
    });

    it("scores matchedWeight/totalWeight * 100", () => {
      let totalWeight = 0;
      for (const w of familyThemeSlugWeights.values()) totalWeight += w;
      const score = scoreInterestThemeWeighted(familyThemeSlugWeights, "water_fun", "not_a_real_variant");
      expect(score).toBeCloseTo((4 / totalWeight) * 100);
    });

    it("sums both themeSlug and themeVariantSlug weights when both match", () => {
      const score    = scoreInterestThemeWeighted(familyThemeSlugWeights, "water_fun", "scenic_walks");
      let totalWeight = 0;
      for (const w of familyThemeSlugWeights.values()) totalWeight += w;
      expect(score).toBeCloseTo(((4 + 2) / totalWeight) * 100);
    });

    it("defaults to 50 (neutral) when there are no family theme slugs at all", () => {
      expect(scoreInterestThemeWeighted(new Map(), "water_fun", "")).toBe(50);
    });
  });

  describe("buildChildTagWeights / scoreInterestTagsWeighted", () => {
    const childTagWeights = buildChildTagWeights(params.narrowed.children.map((c) => c.interestTags ?? []));

    it("weights a tag shared by 2 children as 2", () => {
      expect(childTagWeights.get("birds")).toBe(2);
    });

    it("weights a tag only 1 child picked as 1", () => {
      expect(childTagWeights.get("dancing")).toBe(1);
    });

    it("scores a candidate matching the shared tag higher than one matching only a single-child tag", () => {
      const sharedTagScore = scoreInterestTagsWeighted(childTagWeights, ["birds"]);
      const singleTagScore = scoreInterestTagsWeighted(childTagWeights, ["dancing"]);
      expect(sharedTagScore).toBeGreaterThan(singleTagScore);
    });

    it("scores matchedWeight/totalWeight * 100", () => {
      let totalWeight = 0;
      for (const w of childTagWeights.values()) totalWeight += w;
      const score = scoreInterestTagsWeighted(childTagWeights, ["birds"]);
      expect(score).toBeCloseTo((2 / totalWeight) * 100);
    });

    it("defaults to 50 (neutral) when no child has any tags at all", () => {
      expect(scoreInterestTagsWeighted(new Map(), ["birds"])).toBe(50);
    });
  });

  describe("themeVariantSlug against real venues.json data", () => {
    // themeSlug is always a single value in the asset data (0 comma-containing values across
    // venues/events/clubs/routes), but themeVariantSlug is frequently a comma-separated list of
    // several sub-variants — e.g. 26 of 65 distinct venue themeVariantSlug values contain a comma.
    it("confirms themeVariantSlug is commonly a comma-separated multi-value string in venues.json", () => {
      const distinctVariants = new Set(venues.map((v) => v.themeVariantSlug));
      const commaContaining  = [...distinctVariants].filter((v) => v.includes(","));
      expect(commaContaining.length).toBeGreaterThan(0);
    });

    // KNOWN LIMITATION (not desired behavior): scoreInterestOverlap treats the whole
    // comma-separated themeVariantSlug as one opaque token instead of splitting it, so a family
    // slug that matches one of several listed variants scores 0 instead of counting as a match.
    it("does not currently credit a match against one value inside a comma-separated themeVariantSlug", () => {
      const exmouthBeach = venues.find((v) => v.id === "exmouth_beach")!;
      expect(exmouthBeach.themeVariantSlug).toBe("sandy_beach, rnli_beach, dog_friendly_beaches");

      // The family is only interested in "dog_friendly_beaches" — one of the three variants
      // this venue actually offers — yet the score comes back 0, not a partial/full match.
      const family = new Set(["dog_friendly_beaches"]);
      const score  = scoreInterestOverlap(family, exmouthBeach.themeSlug, exmouthBeach.themeVariantSlug);
      expect(score).toBe(0);
    });
  });

  describe("scoreTagOverlap", () => {
    it("scores 0 when none of the candidate's tags match the family's free-text tags", () => {
      expect(scoreTagOverlap(childTags, ["kayaking", "pottery"])).toBe(0);
    });

    it("scores matched/total * 100 when one of the family's tags is present", () => {
      const score = scoreTagOverlap(childTags, ["birds", "kayaking"]);
      expect(score).toBeCloseTo((1 / childTags.length) * 100);
    });

    it("scores 100 when every one of the family's tags is present on the candidate", () => {
      expect(scoreTagOverlap(childTags, childTags)).toBe(100);
    });

    it("matches case-insensitively and ignores surrounding whitespace", () => {
      const score = scoreTagOverlap(childTags, [" BIRDS "]);
      expect(score).toBeCloseTo((1 / childTags.length) * 100);
    });

    it("defaults to 50 (neutral) when the family has no free-text tags selected", () => {
      expect(scoreTagOverlap([], ["birds", "cycling"])).toBe(50);
    });
  });

  describe("scoreAge against real candidate ageBands from venues.json", () => {
    it("scores 100 when every ageBand is selected, matching every child", async () => {
      const repo = new RecommendationV2Repository();
      const candidates = await repo.getOpportunityCandidatesV2();
      const haldon = candidates.find((c) => c.id === "haldon_forest_park")!;
      expect(Object.values(haldon.ageBands).every((v) => v === true)).toBe(true);

      expect(scoreAge(childAges, haldon.ageBands)).toBe(100);
    });

    it("scores matched/total * 100 when only some ageBands cover the family's children", async () => {
      const repo = new RecommendationV2Repository();
      const candidates = await repo.getOpportunityCandidatesV2();
      const basketballCourts = candidates.find((c) => c.id === "manstone_basketball_courts")!;
      expect(basketballCourts.ageBands).toEqual({
        under1: false, ages1To2: false, ages3To4: false, ages5To7: true,
        ages8To12: true, over13: true, adults: true,
      });

      // childAges [8, 3, 5]: the 8yo (ages8To12) and 5yo (ages5To7) match, the 3yo (ages3To4,
      // not selected here) doesn't -> 2 of 3 children match.
      expect(scoreAge(childAges, basketballCourts.ageBands)).toBeCloseTo((2 / 3) * 100);
    });

    it("scores 100 (neutral) when no ageBand is selected on the candidate at all", () => {
      const noBandsSelected = {
        under1: null, ages1To2: null, ages3To4: null, ages5To7: null,
        ages8To12: null, over13: null, adults: null,
      };
      expect(scoreAge(childAges, noBandsSelected)).toBe(100);
    });

    it("scores 100 (neutral) when there are no children to score", () => {
      const anyBands = { under1: true, ages1To2: false, ages3To4: false, ages5To7: false, ages8To12: false, over13: false, adults: false };
      expect(scoreAge([], anyBands)).toBe(100);
    });
  });

  describe("scoreSchedule against real candidate data", () => {
    // Routes are the one type-independent, time-independent case (always 100 regardless of
    // startTime/endTime/startDate/endDate/activeDays or what time it is right now) — the other
    // types (venue/event/club) depend on the current wall-clock time, so aren't asserted here to
    // avoid a flaky test.
    it("scores every route 100 regardless of the current time", async () => {
      const repo = new RecommendationV2Repository();
      const candidates = await repo.getOpportunityCandidatesV2();
      const routes = candidates.filter((c) => c.type === "route");
      expect(routes.length).toBeGreaterThan(0);

      for (const route of routes) {
        expect(scoreSchedule(route.type, route.startDate, route.endDate, route.activeDays, route.startTime, route.endTime)).toBe(100);
      }
    });

    it("scores a venue 0 when it has no resolved opening time for today at all", () => {
      expect(scoreSchedule("venue", null, null, ["monday"], null, null)).toBe(0);
    });

    it("scores a venue 0 when it has no activeDays at all", () => {
      expect(scoreSchedule("venue", null, null, undefined, "09:00", "17:00")).toBe(0);
      expect(scoreSchedule("venue", null, null, [], "09:00", "17:00")).toBe(0);
    });

    it("scores an event 0 when it has no start/end date at all", () => {
      expect(scoreSchedule("event", null, null, undefined, "09:00", "17:00")).toBe(0);
    });

    it("scores a club 0 when it has no activeDays at all", () => {
      expect(scoreSchedule("club", null, null, [], "09:00", "17:00")).toBe(0);
    });

    // The 3 candidates below all have *fixed* daily timings (same hours every day they run), so
    // their startTime/endTime/activeDays are stable regardless of which real weekday the test
    // suite happens to run on — only the fake system time below controls the scenario.
    describe("venue: haldon_forest_park (fixed daily timing, open every day, 07:00-21:00)", () => {
      let activeDays: string[] | undefined;
      let startTime: string | null;
      let endTime: string | null;

      beforeAll(async () => {
        const repo = new RecommendationV2Repository();
        const candidates = await repo.getOpportunityCandidatesV2();
        const venue = candidates.find((c) => c.id === "haldon_forest_park")!;
        expect(venue.activeDays).toEqual(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
        expect(venue.startTime).toBe("07:00");
        expect(venue.endTime).toBe("21:00");
        activeDays = venue.activeDays;
        startTime  = venue.startTime ?? null;
        endTime    = venue.endTime ?? null;
      });

      afterEach(() => vi.useRealTimers());

      it("scores 0 well before opening", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T05:00:00Z")); // Monday 05:00 UK time, opens 07:00
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(0);
      });

      it("scores 100 when starting within the hour", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T06:30:00Z")); // Monday, 30 min before opening
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(100);
      });

      it("scores 90 when currently open but not imminent", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T12:00:00Z")); // Monday midday, well within 07:00-21:00
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(90);
      });

      it("scores 0 after closing", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T22:00:00Z")); // Monday, 1hr after 21:00 close
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(0);
      });

      it("scores 90 still exactly at endTime, but 0 the very next minute — no grace window after closing", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T21:00:00Z")); // Monday, exactly 21:00
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(90);

        vi.setSystemTime(new Date("2026-01-05T21:01:00Z")); // 21:01 — 1 minute past close
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(0);
      });
    });

    // Regression coverage for the bug where a venue with a fixed daily
    // timing (e.g. weekend-only) scored as open on every day of the week —
    // getVenueTodayTimes() resolved a startTime/endTime regardless of day,
    // and scoreSchedule's venue branch never checked activeDays at all.
    describe("venue: lower_halsdon_farm_cafe (fixed daily timing, Saturday/Sunday only, 10:00-16:00)", () => {
      let activeDays: string[] | undefined;
      let startTime: string | null;
      let endTime: string | null;

      beforeAll(async () => {
        const repo = new RecommendationV2Repository();
        const candidates = await repo.getOpportunityCandidatesV2();
        const venue = candidates.find((c) => c.id === "lower_halsdon_farm_cafe")!;
        expect(venue.activeDays).toEqual(["saturday", "sunday"]);
        expect(venue.startTime).toBe("10:00");
        expect(venue.endTime).toBe("16:00");
        activeDays = venue.activeDays;
        startTime  = venue.startTime ?? null;
        endTime    = venue.endTime ?? null;
      });

      afterEach(() => vi.useRealTimers());

      it("scores 0 on a non-running day (Tuesday), even during what would be opening hours", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-06T12:00:00Z")); // Tuesday midday — closed all week except Sat/Sun
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(0);
      });

      it("scores 90 when currently open on a running day (Saturday)", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-03T12:00:00Z")); // Saturday midday, within 10:00-16:00
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(90);
      });

      it("scores 100 when starting within the hour on a running day (Sunday)", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-04T09:30:00Z")); // Sunday, 30 min before 10:00 opening
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(100);
      });

      it("scores 0 after closing on a running day (Saturday)", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-03T17:00:00Z")); // Saturday, 1hr after 16:00 close
        expect(scoreSchedule("venue", null, null, activeDays, startTime, endTime)).toBe(0);
      });
    });

    describe("club: ocean_softplay_afterschool_club (fixed daily timing, Mon-Fri 15:30-18:00)", () => {
      let activeDays: string[] | undefined;
      let startTime: string | null;
      let endTime: string | null;

      beforeAll(async () => {
        const repo = new RecommendationV2Repository();
        const candidates = await repo.getOpportunityCandidatesV2();
        const club = candidates.find((c) => c.id === "ocean_softplay_afterschool_club")!;
        expect(club.activeDays).toEqual(["monday", "tuesday", "wednesday", "thursday", "friday"]);
        expect(club.startTime).toBe("15:30");
        expect(club.endTime).toBe("18:00");
        activeDays = club.activeDays;
        startTime  = club.startTime ?? null;
        endTime    = club.endTime ?? null;
      });

      afterEach(() => vi.useRealTimers());

      it("scores 0 on a non-running day (Saturday)", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-10T16:00:00Z")); // Saturday, within what would be hours
        expect(scoreSchedule("club", null, null, activeDays, startTime, endTime)).toBe(0);
      });

      it("scores 0 well before opening on a running day (Monday)", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T13:00:00Z")); // Monday 13:00, opens 15:30
        expect(scoreSchedule("club", null, null, activeDays, startTime, endTime)).toBe(0);
      });

      it("scores 100 when starting within the hour on a running day", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T15:00:00Z")); // Monday, 30 min before opening
        expect(scoreSchedule("club", null, null, activeDays, startTime, endTime)).toBe(100);
      });

      it("scores 90 when currently open but not imminent", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T16:30:00Z")); // Monday, mid-session
        expect(scoreSchedule("club", null, null, activeDays, startTime, endTime)).toBe(90);
      });

      it("scores 0 after closing on a running day", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-05T19:00:00Z")); // Monday, 1hr after 18:00 close
        expect(scoreSchedule("club", null, null, activeDays, startTime, endTime)).toBe(0);
      });
    });

    describe("event: ashridge_court (fixed daily timing, 2026-11-06 11:00-16:00)", () => {
      let startDate: string | null;
      let endDate: string | null;
      let startTime: string | null;
      let endTime: string | null;

      beforeAll(async () => {
        const repo = new RecommendationV2Repository();
        const candidates = await repo.getOpportunityCandidatesV2();
        const event = candidates.find((c) => c.id === "ashridge_court")!;
        expect(event.startDate).toBe("2026-11-06T00:00:00.000Z");
        expect(event.endDate).toBe("2026-11-06T00:00:00.000Z");
        expect(event.startTime).toBe("11:00");
        expect(event.endTime).toBe("16:00");
        startDate = event.startDate ?? null;
        endDate   = event.endDate ?? null;
        startTime = event.startTime ?? null;
        endTime   = event.endTime ?? null;
      });

      afterEach(() => vi.useRealTimers());

      it("scores 0 before the event's date", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
        expect(scoreSchedule("event", startDate, endDate, undefined, startTime, endTime)).toBe(0);
      });

      it("scores 0 after the event's date", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-10T12:00:00Z"));
        expect(scoreSchedule("event", startDate, endDate, undefined, startTime, endTime)).toBe(0);
      });

      it("scores 0 on the event's date, well before it starts", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-06T09:00:00Z")); // opens 11:00
        expect(scoreSchedule("event", startDate, endDate, undefined, startTime, endTime)).toBe(0);
      });

      it("scores 100 on the event's date, starting within the hour", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-06T10:30:00Z"));
        expect(scoreSchedule("event", startDate, endDate, undefined, startTime, endTime)).toBe(100);
      });

      it("scores 90 on the event's date, currently open but not imminent", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-06T13:00:00Z"));
        expect(scoreSchedule("event", startDate, endDate, undefined, startTime, endTime)).toBe(90);
      });

      it("scores 0 on the event's date, after it ends", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-06T17:00:00Z")); // closes 16:00
        expect(scoreSchedule("event", startDate, endDate, undefined, startTime, endTime)).toBe(0);
      });
    });
  });

  describe("mapWeatherToSuitabilitySlugs", () => {
    it("maps a sunny, mild reading to sunshine + dry_mild", () => {
      const slugs = mapWeatherToSuitabilitySlugs({ condition: { code: 1000, isWindy: false }, temp_c: 15 });
      expect(slugs).toEqual(["sunshine", "dry_mild"]);
    });

    it("maps a cloudy/overcast, cold reading to overcast + dry_cold", () => {
      const slugs = mapWeatherToSuitabilitySlugs({ condition: { code: 1009, isWindy: false }, temp_c: 4 });
      expect(slugs).toEqual(["overcast", "dry_cold"]);
    });

    it("maps a rainy reading to wet_rain only, with no dry_* temperature band", () => {
      const slugs = mapWeatherToSuitabilitySlugs({ condition: { code: 1183, isWindy: false }, temp_c: 12 });
      expect(slugs).toEqual(["wet_rain"]);
    });

    it("maps a snowy reading to snow_ice only", () => {
      const slugs = mapWeatherToSuitabilitySlugs({ condition: { code: 1213, isWindy: false }, temp_c: -2 });
      expect(slugs).toEqual(["snow_ice"]);
    });

    it("maps a thundery reading to storm_heavy_rain only", () => {
      const slugs = mapWeatherToSuitabilitySlugs({ condition: { code: 1273, isWindy: false }, temp_c: 18 });
      expect(slugs).toEqual(["storm_heavy_rain"]);
    });

    it("adds windy when isWindy is true, alongside the sky/temp slugs", () => {
      const slugs = mapWeatherToSuitabilitySlugs({ condition: { code: 1000, isWindy: true }, temp_c: 30 });
      expect(slugs).toEqual(["sunshine", "dry_hot", "windy"]);
    });
  });

  describe("scoreWeatherSuitability", () => {
    // Skip is now represented as 0 (not null) so getItemsWithScore can drop it with a plain
    // `!== 0` filter, same convention as scheduleScore/intrestScore.
    it("scores 0 (skip) for an outside candidate whose weatherSuitability doesn't include the live condition", () => {
      const score = scoreWeatherSuitability(["overcast"], ["outside"], ["sunshine", "dry_mild"]);
      expect(score).toBe(0);
    });

    it("scores 5 for an outside candidate whose weatherSuitability does include the live condition", () => {
      const score = scoreWeatherSuitability(["overcast"], ["outside"], ["sunshine", "overcast"]);
      expect(score).toBe(5);
    });

    it("scores 8 for an inside candidate that doesn't match, higher than an outside match", () => {
      const score = scoreWeatherSuitability(["overcast"], ["inside"], ["sunshine"]);
      expect(score).toBe(8);
      expect(score).toBeGreaterThan(scoreWeatherSuitability(["overcast"], ["outside"], ["sunshine", "overcast"]));
    });

    it("scores 10 for an inside candidate that also matches — the highest tier", () => {
      const score = scoreWeatherSuitability(["overcast"], ["inside"], ["sunshine", "overcast"]);
      expect(score).toBe(10);
    });

    it("treats mixed_covering the same as inside (weather-immune)", () => {
      expect(scoreWeatherSuitability(["overcast"], ["mixed_covering"], [])).toBe(8);
    });
  });

  describe("getCachedWeatherSuitabilitySlugs", () => {
    beforeEach(() => {
      getWeatherByPostcodeMock.mockReset();
      getWeatherByPostcodeMock.mockResolvedValue({
        condition: { text: "Sunny", icon: "", code: 1000, isDay: true, isWindy: false },
        wind_mph: 5,
        temp_c: 20,
        localtime: "2026-01-01 12:00",
      });
    });

    it("translates the weather.service reading into weatherSuitability slugs", async () => {
      const slugs = await getCachedWeatherSuitabilitySlugs("EX8 5JG");
      expect(slugs).toEqual(["sunshine", "dry_warm"]);
    });

    it("caches by postcode — a second call for the same postcode doesn't hit weather.service again", async () => {
      await getCachedWeatherSuitabilitySlugs("EX1 1AA");
      await getCachedWeatherSuitabilitySlugs("EX1 1AA");
      expect(getWeatherByPostcodeMock).toHaveBeenCalledTimes(1);
    });

    it("is case/whitespace-insensitive for the cache key (same postcode, different formatting)", async () => {
      await getCachedWeatherSuitabilitySlugs("EX2 2BB");
      await getCachedWeatherSuitabilitySlugs(" ex2 2bb ");
      expect(getWeatherByPostcodeMock).toHaveBeenCalledTimes(1);
    });

    it("fetches separately for a different postcode not yet cached", async () => {
      await getCachedWeatherSuitabilitySlugs("EX3 3CC");
      await getCachedWeatherSuitabilitySlugs("EX4 4DD");
      expect(getWeatherByPostcodeMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("scoreDistance", () => {
    it("scores 0 when the distance is at or beyond maxMiles", () => {
      expect(scoreDistance(10, 10)).toBe(0);
      expect(scoreDistance(15, 10)).toBe(0);
    });

    it("scores 0 when maxMiles is 0 or negative", () => {
      expect(scoreDistance(1, 0)).toBe(0);
      expect(scoreDistance(1, -5)).toBe(0);
    });

    it("scores 100 when the distance is 0 or negative (right on top of the parent)", () => {
      expect(scoreDistance(0, 10)).toBe(100);
      expect(scoreDistance(-1, 10)).toBe(100);
    });

    it("falls off linearly between 0 and maxMiles", () => {
      expect(scoreDistance(5, 10)).toBe(50);
      expect(scoreDistance(2, 10)).toBe(80);
    });
  });

  describe("combineWeighted", () => {
    it("sums all 6 score dimensions into total, and totalWeighted is total/6 rounded", () => {
      const score: Score = {
        intrestScore: 10, interestTagsScore: 20, ageScore: 100,
        scheduleScore: 90, weatherScore: 5, distanceScore: 50,
        total: 0, totalWeighted: 0,
      };
      const { total, totalWeighted } = combineWeighted(score);
      expect(total).toBe(10 + 20 + 100 + 90 + 5 + 50);
      expect(totalWeighted).toBe(Math.round(total / 6));
    });

    it("totals 0 when every dimension is 0", () => {
      const score: Score = {
        intrestScore: 0, interestTagsScore: 0, ageScore: 0,
        scheduleScore: 0, weatherScore: 0, distanceScore: 0,
        total: 0, totalWeighted: 0,
      };
      expect(combineWeighted(score)).toEqual({ total: 0, totalWeighted: 0 });
    });
  });

  describe("rankWithShuffle", () => {
    type Item = { id: string; score: { total: number; totalWeighted: number; interestTagsScore: number } };

    it("sorts by total descending", () => {
      const items: Item[] = [
        { id: "low",  score: { total: 10, totalWeighted: 2, interestTagsScore: 0 } },
        { id: "high", score: { total: 90, totalWeighted: 15, interestTagsScore: 0 } },
        { id: "mid",  score: { total: 50, totalWeighted: 8, interestTagsScore: 0 } },
      ];
      expect(rankWithShuffle(items).map((i) => i.id)).toEqual(["high", "mid", "low"]);
    });

    it("breaks ties on total by interestTagsScore descending", () => {
      const items: Item[] = [
        { id: "lowTag",  score: { total: 50, totalWeighted: 8, interestTagsScore: 5 } },
        { id: "highTag", score: { total: 50, totalWeighted: 8, interestTagsScore: 20 } },
      ];
      expect(rankWithShuffle(items).map((i) => i.id)).toEqual(["highTag", "lowTag"]);
    });

    // KNOWN LIMITATION (not desired behavior): the tie-detection loop compares `sorted[j].score
    // === sorted[i].score` — an object-reference check — instead of comparing score.total values.
    // Two distinct candidate objects with numerically identical scores are never distinct-object
    // references, so this condition is always false and the shuffle-on-ties branch never runs in
    // practice. This pins the *current* (unshuffled, but still correctly ordered) behavior rather
    // than asserting the intended "randomize exact ties" behavior.
    it("does not currently shuffle candidates that are tied on both total and interestTagsScore", () => {
      const items: Item[] = [
        { id: "a", score: { total: 50, totalWeighted: 8, interestTagsScore: 10 } },
        { id: "b", score: { total: 50, totalWeighted: 8, interestTagsScore: 10 } },
        { id: "c", score: { total: 50, totalWeighted: 8, interestTagsScore: 10 } },
      ];
      const orderings = new Set<string>();
      for (let i = 0; i < 20; i++) {
        orderings.add(rankWithShuffle(items).map((x) => x.id).join(","));
      }
      expect(orderings.size).toBe(1);
      expect([...orderings][0]).toBe("a,b,c");
    });
  });

  describe("getInitialScore", () => {
    it("returns every dimension at 0 (and total/totalWeighted 0) when called with no flags", () => {
      expect(getInitialScore({})).toEqual({
        intrestScore: 0,
        interestTagsScore: 0,
        ageScore: 0,
        scheduleScore: 0,
        weatherScore: 0,
        distanceScore: 0,
        total: 0,
        totalWeighted: 0,
      });
    });

    it("skipAll sets every dimension (including total/totalWeighted) to 100, ignoring the individual skip flags", () => {
      expect(getInitialScore({ skipAll: true, skipInterests: false })).toEqual({
        intrestScore: 100,
        interestTagsScore: 100,
        ageScore: 100,
        scheduleScore: 100,
        weatherScore: 100,
        distanceScore: 100,
        total: 100,
        totalWeighted: 100,
      });
    });

    it("sets only the flagged dimensions to 100, leaving the rest at 0", () => {
      expect(getInitialScore({ skipInterests: true, skipDistance: true })).toEqual({
        intrestScore: 100,
        interestTagsScore: 0,
        ageScore: 0,
        scheduleScore: 0,
        weatherScore: 0,
        distanceScore: 100,
        total: 0,
        totalWeighted: 0,
      });
    });

    it("maps each individual skip flag to its own Score field", () => {
      expect(getInitialScore({ skipIntrestTags: true }).interestTagsScore).toBe(100);
      expect(getInitialScore({ skipAges: true }).ageScore).toBe(100);
      expect(getInitialScore({ skipWeather: true }).weatherScore).toBe(100);
      expect(getInitialScore({ skipSchedule: true }).scheduleScore).toBe(100);
    });
  });
});
