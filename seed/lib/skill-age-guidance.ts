export type SkillAgeBounds = { minAge: number | null; maxAge: number | null };

export function skillBoundsFromAgeGuidance(text: string): SkillAgeBounds {
  const andOver = /age\s*(\d+)\s+and\s+over/i.exec(text);
  if (andOver) {
    const n = Number.parseInt(andOver[1]!, 10);
    if (!Number.isNaN(n)) return { minAge: n, maxAge: null };
  }
  return { minAge: null, maxAge: null };
}

export function childMatchesSkillAgeBounds(
  childAgeYears: number,
  minAge: number | null,
  maxAge: number | null,
): boolean {
  if (minAge != null && childAgeYears < minAge) return false;
  if (maxAge != null && childAgeYears > maxAge) return false;
  return true;
}
