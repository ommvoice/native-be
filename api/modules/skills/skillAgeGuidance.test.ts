import { describe, expect, it } from "vitest";
import {
  childMatchesSkillAgeBounds,
  skillBoundsFromAgeGuidance,
} from "./skillAgeGuidance.js";

describe("skillBoundsFromAgeGuidance (maps to Skill.minAge / Skill.maxAge)", () => {
  it('parses "Age N and over" with minAge N and maxAge null', () => {
    expect(skillBoundsFromAgeGuidance("Age 6 and over")).toEqual({
      minAge: 6,
      maxAge: null,
    });
    expect(skillBoundsFromAgeGuidance("Typically suitable from age 8 and over; providers vary.")).toEqual({
      minAge: 8,
      maxAge: null,
    });
  });

  it("is case-insensitive and allows flexible spacing", () => {
    expect(skillBoundsFromAgeGuidance("AGE 10 AND OVER")).toEqual({ minAge: 10, maxAge: null });
    expect(skillBoundsFromAgeGuidance("age  5  and  over")).toEqual({ minAge: 5, maxAge: null });
  });

  it("uses the first matching phrase when several appear", () => {
    expect(
      skillBoundsFromAgeGuidance("Intro age 4 and over. Usually age 8 and over for advanced."),
    ).toEqual({ minAge: 4, maxAge: null });
  });

  it("returns null bounds when the pattern is missing", () => {
    expect(skillBoundsFromAgeGuidance("")).toEqual({ minAge: null, maxAge: null });
    expect(skillBoundsFromAgeGuidance("All ages welcome")).toEqual({ minAge: null, maxAge: null });
    expect(skillBoundsFromAgeGuidance("Ages 3–5 only")).toEqual({ minAge: null, maxAge: null });
    expect(skillBoundsFromAgeGuidance("Age 6+")).toEqual({ minAge: null, maxAge: null });
  });

  it("supports age 0 minimum", () => {
    expect(skillBoundsFromAgeGuidance("Age 0 and over")).toEqual({ minAge: 0, maxAge: null });
  });
});

describe("childMatchesSkillAgeBounds (Skill.minAge / Skill.maxAge semantics)", () => {
  it("treats both null as no restriction", () => {
    expect(childMatchesSkillAgeBounds(0, null, null)).toBe(true);
    expect(childMatchesSkillAgeBounds(3, null, null)).toBe(true);
    expect(childMatchesSkillAgeBounds(16, null, null)).toBe(true);
  });

  it("applies minimum only (typical seed: minAge set, maxAge null)", () => {
    expect(childMatchesSkillAgeBounds(5, 6, null)).toBe(false);
    expect(childMatchesSkillAgeBounds(6, 6, null)).toBe(true);
    expect(childMatchesSkillAgeBounds(14, 6, null)).toBe(true);
  });

  it("applies maximum only", () => {
    expect(childMatchesSkillAgeBounds(11, null, 10)).toBe(false);
    expect(childMatchesSkillAgeBounds(10, null, 10)).toBe(true);
    expect(childMatchesSkillAgeBounds(0, null, 10)).toBe(true);
  });

  it("applies both bounds inclusively", () => {
    expect(childMatchesSkillAgeBounds(4, 5, 8)).toBe(false);
    expect(childMatchesSkillAgeBounds(5, 5, 8)).toBe(true);
    expect(childMatchesSkillAgeBounds(7, 5, 8)).toBe(true);
    expect(childMatchesSkillAgeBounds(8, 5, 8)).toBe(true);
    expect(childMatchesSkillAgeBounds(9, 5, 8)).toBe(false);
  });

  it("handles min 0 with a max", () => {
    expect(childMatchesSkillAgeBounds(0, 0, 4)).toBe(true);
    expect(childMatchesSkillAgeBounds(4, 0, 4)).toBe(true);
    expect(childMatchesSkillAgeBounds(5, 0, 4)).toBe(false);
  });
});

describe("seed guidance → bounds → child fit (integration-style)", () => {
  it("matches seeded copy for a school-age child", () => {
    const description =
      "Ball control, teamwork, and match play. Typically suitable from age 6 and over; providers vary.";
    const bounds = skillBoundsFromAgeGuidance(description);
    expect(bounds).toEqual({ minAge: 6, maxAge: null });
    expect(childMatchesSkillAgeBounds(5, bounds.minAge, bounds.maxAge)).toBe(false);
    expect(childMatchesSkillAgeBounds(6, bounds.minAge, bounds.maxAge)).toBe(true);
  });
});
