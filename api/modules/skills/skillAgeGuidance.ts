export type SkillAgeBounds = { minAge: number | null; maxAge: number | null };

/**
 * Derive `Skill.minAge` / `Skill.maxAge` from free-text age guidance.
 * Supported: "Age 6 and over" → minAge 6, maxAge null (also matches inside a longer sentence).
 */
export function skillBoundsFromAgeGuidance(text: string): SkillAgeBounds {
  const andOver = /age\s*(\d+)\s+and\s+over/i.exec(text);
  if (andOver) {
    const n = Number.parseInt(andOver[1]!, 10);
    if (!Number.isNaN(n)) return { minAge: n, maxAge: null };
  }
  return { minAge: null, maxAge: null };
}

/**
 * Whether a child's age in whole years fits optional `Skill.minAge` / `Skill.maxAge`.
 * `null` on a side means open-ended; both `null` means no stored restriction.
 */
export function childMatchesSkillAgeBounds(
  childAgeYears: number,
  minAge: number | null,
  maxAge: number | null,
): boolean {
  if (minAge != null && childAgeYears < minAge) return false;
  if (maxAge != null && childAgeYears > maxAge) return false;
  return true;
}
