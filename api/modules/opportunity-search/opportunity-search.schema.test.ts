import { describe, expect, it } from "vitest";
import { opportunitySearchQuerySchema } from "./schema.js";

const parentId = "00000000-0000-4000-8000-000000000001";

describe("opportunitySearchQuerySchema", () => {
  it("parses comma-separated facility into unique lowercase slugs", async () => {
    const q = await opportunitySearchQuerySchema.validate({
      parentId,
      facility: " WiFi , dog_bins , wifi ",
    });
    expect(q.facility).toEqual(["wifi", "dog_bins"]);
  });

  it("treats empty facility segments as omitting the filter", async () => {
    const q = await opportunitySearchQuerySchema.validate({
      parentId,
      facility: "  ,  ",
    });
    expect(q.facility).toBeUndefined();
  });

  it("omits facility when not provided", async () => {
    const q = await opportunitySearchQuerySchema.validate({ parentId });
    expect(q.facility).toBeUndefined();
  });
});
