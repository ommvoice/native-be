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
  it("returns scored candidates with interest theme, tag, age, schedule and weather scores that sum to total", async () => {
    const service = new RecommendationV2Service();
    const result = await service.getItemsWithScore(narrowed);

    expect(Array.isArray(result)).toBe(true);
    // Debug slice(0, 2) in getItemsWithScore caps the result at 2 candidates.
    expect(result.length).toBe(2);

    for (const item of result) {
      expect(item.candidate).toBeDefined();
      expect(typeof item.score.intrestScore).toBe("number");
      expect(typeof item.score.interestTagsScore).toBe("number");
      expect(typeof item.score.ageScore).toBe("number");
      expect(typeof item.score.scheduleScore).toBe("number");
      expect(typeof item.score.weatherScore).toBe("number");
      expect(item.score.total).toBe(
        item.score.intrestScore + item.score.interestTagsScore + item.score.ageScore
        + item.score.scheduleScore + item.score.weatherScore,
      );
    }
  });

  it("never returns a candidate with weatherScore null (outside candidates that don't suit the live weather are dropped)", async () => {
    const service = new RecommendationV2Service();
    const result = await service.getItemsWithScore(narrowed);

    for (const item of result) {
      expect(item.score.weatherScore).not.toBeNull();
    }
  });

  it("sorts results by the running total score descending", async () => {
    const service = new RecommendationV2Service();
    const result = await service.getItemsWithScore(narrowed);

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score.total).toBeGreaterThanOrEqual(result[i].score.total);
    }
  });

  it("never returns a candidate with scheduleScore 0 (closed/unscheduled candidates are dropped)", async () => {
    const service = new RecommendationV2Service();
    const result = await service.getItemsWithScore(narrowed);

    for (const item of result) {
      expect(item.score.scheduleScore).not.toBe(0);
    }
  });

  it("throws when the parent's location is invalid", async () => {
    const service = new RecommendationV2Service();
    const invalidNarrowed: Narrowed = { ...narrowed, latitude: "not-a-number" };

    await expect(service.getItemsWithScore(invalidNarrowed)).rejects.toThrow("Parent location is invalid");
  });
});
