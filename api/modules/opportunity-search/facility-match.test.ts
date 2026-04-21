import { describe, expect, it } from "vitest";
import {
  candidateMatchesFacilitySlug,
  candidateMatchesFacilitySlugs,
} from "./facility-match.js";
import type { OpportunitySearchCandidateRow } from "./types.js";

function row(
  partial: Partial<OpportunitySearchCandidateRow>,
): Pick<
  OpportunitySearchCandidateRow,
  | "generalFacilitySlugs"
  | "kidsFacilitySlugs"
  | "parentFacilitySlugs"
  | "dogFacilitySlugs"
> {
  return {
    generalFacilitySlugs: [],
    kidsFacilitySlugs: [],
    parentFacilitySlugs: [],
    dogFacilitySlugs: [],
    ...partial,
  };
}

describe("candidateMatchesFacilitySlug", () => {
  it("matches general slugs case-insensitively", () => {
    expect(
      candidateMatchesFacilitySlug(row({ generalFacilitySlugs: ["Toilets"] }), "toilets"),
    ).toBe(true);
  });

  it("matches kids and parent pools", () => {
    expect(
      candidateMatchesFacilitySlug(row({ kidsFacilitySlugs: ["play_equipment"] }), "play_equipment"),
    ).toBe(true);
    expect(
      candidateMatchesFacilitySlug(row({ parentFacilitySlugs: ["hot_drinks"] }), "HOT_DRINKS"),
    ).toBe(true);
  });

  it("matches dog slugs on routes", () => {
    expect(
      candidateMatchesFacilitySlug(row({ dogFacilitySlugs: ["dog_bins"] }), "dog_bins"),
    ).toBe(true);
  });

  it("returns false when slug is absent from all lists", () => {
    expect(
      candidateMatchesFacilitySlug(row({ generalFacilitySlugs: ["benches"] }), "wifi"),
    ).toBe(false);
  });
});

describe("candidateMatchesFacilitySlugs", () => {
  it("allows all rows when the slug list is empty", () => {
    expect(candidateMatchesFacilitySlugs(row({}), [])).toBe(true);
  });

  it("matches if any requested slug matches (OR)", () => {
    const r = row({ parentFacilitySlugs: ["wifi"], dogFacilitySlugs: [] });
    expect(candidateMatchesFacilitySlugs(r, ["wifi", "dog_bins"])).toBe(true);
    expect(candidateMatchesFacilitySlugs(r, ["dog_bins", "wifi"])).toBe(true);
  });

  it("returns false when none of the slugs match", () => {
    expect(
      candidateMatchesFacilitySlugs(row({ generalFacilitySlugs: ["toilets"] }), [
        "wifi",
        "dog_bins",
      ]),
    ).toBe(false);
  });
});
