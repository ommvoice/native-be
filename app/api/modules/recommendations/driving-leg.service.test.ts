import { describe, it, expect } from "vitest";
import { buildRoutableLeg, metersToMilesOneDecimal } from "./driving-leg.service.js";

describe("metersToMilesOneDecimal", () => {
  it("returns 0 for 0 meters", () => {
    expect(metersToMilesOneDecimal(0)).toBe(0);
  });

  it("converts ~1 statute mile (1609.34 m) to 1.0 mi at one decimal", () => {
    expect(metersToMilesOneDecimal(1609.34)).toBe(1);
  });

  it("converts ~10 miles (16093 m) to 10.0 mi", () => {
    expect(metersToMilesOneDecimal(16093)).toBe(10);
  });

  it("rounds to one decimal place", () => {
    // 5000 m ≈ 3.106856 mi → 3.1
    expect(metersToMilesOneDecimal(5000)).toBe(3.1);
    // 18000 m ≈ 11.1847 mi → 11.2
    expect(metersToMilesOneDecimal(18000)).toBe(11.2);
  });
});

describe("buildRoutableLeg", () => {
  it("snapshots parent and opportunity geo for cache invalidation", () => {
    const parent = {
      postCode: "HP2 7DB",
      latitude: "51.773282",
      longitude: "-0.434612",
    };
    const leg = buildRoutableLeg(parent, "venue", "vid-1", "HP1 1BB", {
      latitude: 51.751393,
      longitude: -0.471936,
    });
    expect(leg.type).toBe("venue");
    expect(leg.id).toBe("vid-1");
    expect(leg.lat).toBeCloseTo(51.751393);
    expect(leg.lon).toBeCloseTo(-0.471936);
    expect(leg.snapshot.parentPostCode).toBe("HP2 7DB");
    expect(leg.snapshot.opportunityLatitude).toBe("51.751393");
    expect(leg.snapshot.opportunityLongitude).toBe("-0.471936");
    expect(leg.snapshot.opportunityPostCode).toBe("HP1 1BB");
  });
});
