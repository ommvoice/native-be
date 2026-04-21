import { describe, it, expect } from "vitest";
import { parseMatrixOneToManyResponse } from "./mapbox-routing.js";

describe("parseMatrixOneToManyResponse", () => {
  it("parses Ok 1×N row for sources=0 destinations=1;2", () => {
    const body = {
      code: "Ok",
      durations: [[573, 597]],
      distances: [[5000, 5200]],
    };
    const { legs } = parseMatrixOneToManyResponse(body, 2);
    expect(legs).toHaveLength(2);
    expect(legs[0]).toEqual({ durationSeconds: 573, distanceMeters: 5000 });
    expect(legs[1]).toEqual({ durationSeconds: 597, distanceMeters: 5200 });
  });

  it("returns nulls when code is not Ok", () => {
    const { legs } = parseMatrixOneToManyResponse({ code: "NoRoute" }, 2);
    expect(legs.every((l) => l.distanceMeters === null && l.durationSeconds === null)).toBe(true);
  });

  it("handles null matrix cells", () => {
    const body = {
      code: "Ok",
      durations: [[573, null]],
      distances: [[5000, null]],
    };
    const { legs } = parseMatrixOneToManyResponse(body, 2);
    expect(legs[0]).toEqual({ durationSeconds: 573, distanceMeters: 5000 });
    expect(legs[1]).toEqual({ durationSeconds: null, distanceMeters: null });
  });
});
