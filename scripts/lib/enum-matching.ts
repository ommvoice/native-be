/**
 * Shared slug/name-matching helpers used by both scripts/generate-enums.ts
 * (building the canonical enum files from the "Enums" sheet) and
 * scripts/parse-events-data.ts (matching free-text sheet values against
 * those enums). Kept here so both scripts resolve names to slugs the same way.
 */

export interface EnumEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’"]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function wordSet(s: string): string {
  return normalizeForMatch(s).split(" ").filter(Boolean).sort().join(" ");
}

/** Exact match first, then word-order-independent match (sheet has cases like "Green Open Spaces" vs "Open Green Spaces"). */
export function matchByName(candidates: EnumEntry[], name: string): EnumEntry | undefined {
  const target = normalizeForMatch(name);
  const exact = candidates.find((c) => normalizeForMatch(c.name) === target);
  if (exact) return exact;
  const targetWords = wordSet(name);
  return candidates.find((c) => wordSet(c.name) === targetWords);
}

/**
 * Resolves a free-text sheet value against an enum's entries: exact name match,
 * then slug-equivalence (catches wording drift like "Spring flowers" vs the
 * canonical "Springtime"/spring_flowers), then word-order-independent name match.
 */
export function matchEnumValue(candidates: EnumEntry[], value: string): EnumEntry | undefined {
  const byName = matchByName(candidates, value);
  if (byName) return byName;
  const bySlug = slugify(value);
  return candidates.find((c) => c.slug === bySlug);
}
