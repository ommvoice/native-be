import { describe, it, expect, vi } from "vitest";

// getItemsWithScore now calls weatherapi.com (via scoring-v2.service's getCachedWeatherSuitabilitySlugs
// -> weather.service's getWeatherByPostcode) — stub the network boundary so this suite stays fast,
// deterministic and offline. Fixed reading: sunny, 20C, not windy -> maps to ["sunshine", "dry_warm"].
vi.mock("../app/services/weather.service.js", () => ({
  getWeatherByPostcode: vi.fn().mockResolvedValue({
    condition: { text: "Sunny", icon: "https://example.com/icon.png", code: 1000, isDay: true, isWindy: false },
    wind_mph: 5,
    temp_c: 20,
    localtime: "2026-01-01 12:00",
  }),
}));

// getItemsWithScore's distance step also now calls DrivingLegService.ensureLegsCached, which hits a
// DynamoDB driving-legs table (TABLE_DRIVING_LEGS) that isn't deployed in this dev AWS account at
// all — stub it to return an empty cache (drivingDistanceMiles/drivingDurationSeconds end up null,
// same as the real "nothing cached yet, Mapbox lookup failed/skipped" case). Keep buildRoutableLeg
// real since it's a pure function used directly by recommendation-v2.service.ts too.
vi.mock("../app/services/driving-leg.service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../app/services/driving-leg.service.js")>();
  class MockDrivingLegService {
    ensureLegsCached = vi.fn().mockResolvedValue(new Map());
  }
  return {
    ...actual,
    DrivingLegService: MockDrivingLegService,
  };
});

import { RecommendationV2Service } from "../app/services/recommendation-v2.service.js";
import params from "../app/shared/assets/params.json" with { type: "json" };
import type { Narrowed } from "../app/shared/types/assets.types.js";

// Same fixture/setup as scripts/test-recommendations.ts: params.narrowed is a captured
// real parent+children payload, with dateOfBirth parsed from string to Date.
const narrowed: Narrowed = {
  ...params.narrowed,
  children: params.narrowed.children.map((c) => ({
    ...c,
    dateOfBirth: new Date(c.dateOfBirth),
  })),
};

describe("RecommendationV2Service.getItemsWithScore", () => {
  it("returns { data, childrenAges } with every score dimension present and total = the sum of all 6", async () => {
    const service = new RecommendationV2Service();
    const result = await service.getItemsWithScore(narrowed);

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("childrenAges");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.childrenAges).toEqual(narrowed.children.map(() => expect.any(Number)));

    for (const item of result.data) {
      const s = item.score;
      expect(typeof s.intrestScore).toBe("number");
      expect(typeof s.interestTagsScore).toBe("number");
      expect(typeof s.ageScore).toBe("number");
      expect(typeof s.scheduleScore).toBe("number");
      expect(typeof s.weatherScore).toBe("number");
      expect(typeof s.distanceScore).toBe("number");
      expect(s.total).toBeCloseTo(
        s.intrestScore + s.interestTagsScore + s.ageScore + s.scheduleScore + s.weatherScore + s.distanceScore,
      );
      expect(s.totalWeighted).toBe(Math.round(s.total / 6));
    }
  });

  it("never returns a candidate with intrestScore, scheduleScore, weatherScore or distanceScore equal to 0 (each step drops its own zero-scored candidates)", async () => {
    const service = new RecommendationV2Service();
    const { data } = await service.getItemsWithScore(narrowed);

    for (const item of data) {
      expect(item.score.intrestScore).not.toBe(0);
      expect(item.score.scheduleScore).not.toBe(0);
      expect(item.score.weatherScore).not.toBe(0);
      expect(item.score.distanceScore).not.toBe(0);
    }
  });

  it("never returns a candidate with totalWeighted 0", async () => {
    const service = new RecommendationV2Service();
    const { data } = await service.getItemsWithScore(narrowed);

    for (const item of data) {
      expect(item.score.totalWeighted).not.toBe(0);
    }
  });

  it("sorts results by total score descending", async () => {
    const service = new RecommendationV2Service();
    const { data } = await service.getItemsWithScore(narrowed);

    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].score.total).toBeGreaterThanOrEqual(data[i].score.total);
    }
  });

  it("attaches the enriched opportunity payload alongside the score/schedule/distance fields", async () => {
    const service = new RecommendationV2Service();
    const { data } = await service.getItemsWithScore(narrowed);

    const item = data[0]!;
    expect(typeof item.id).toBe("string");
    expect(typeof item.opportunityType).toBe("string");
    expect(typeof item.distanceMiles).toBe("number");
    // startTime/endTime/startDate/endDate/weekDay are legitimately null for routes (no schedule
    // fields at all) — only currentTime/timeAndDate are always populated strings.
    expect(item.schedule).toHaveProperty("startTime");
    expect(item.schedule).toHaveProperty("endTime");
    expect(item.schedule).toHaveProperty("startDate");
    expect(item.schedule).toHaveProperty("endDate");
    expect(item.schedule).toHaveProperty("weekDay");
    expect(item.schedule.currentTime).toEqual(expect.any(String));
    expect(item.schedule.timeAndDate).toEqual(expect.any(String));
  });

  it("throws 'Location is invalid' when narrowed.latitude/longitude can't be parsed", async () => {
    const service = new RecommendationV2Service();
    const invalidNarrowed: Narrowed = { ...narrowed, latitude: "not-a-number" };

    await expect(service.getItemsWithScore(invalidNarrowed)).rejects.toThrow("Location is invalid");
  });

  it("uses narrowed.opp (lat/long) instead of narrowed.latitude/longitude when present, for distance scoring", async () => {
    const service = new RecommendationV2Service();

    // opp deliberately set to the same coordinates as narrowed itself, and narrowed's own
    // latitude/longitude deliberately broken — if opp weren't actually used, this would throw
    // "Location is invalid" instead of succeeding.
    const withOpp: Narrowed = {
      ...narrowed,
      latitude: "not-a-number",
      longitude: "not-a-number",
      opp: { lat: narrowed.latitude, long: narrowed.longitude },
    };

    const { data } = await service.getItemsWithScore(withOpp);
    expect(data.length).toBeGreaterThan(0);
  });
});
