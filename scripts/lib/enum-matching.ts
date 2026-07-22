/**
 * Shared slug/name-matching helpers used by both scripts/generate-enums.ts
 * (building the canonical enum files from the "Enums" sheet) and
 * scripts/parse-events-data.ts (matching free-text sheet values against
 * those enums). Kept here so both scripts resolve names to slugs the same way.
 */

/**
 * Base shape for a generated enum entry — just what scripts/parse-*-data.ts
 * need for matching (name/slug) and minting new entries. Relations to other
 * enums are NOT a generic `relatedEnumNameSlugs` field here — each concept
 * gets its own specifically-named array (e.g. `opportunityThemeSlugs`,
 * `interestCategorySlugs`), which scripts/generate-enums.ts adds dynamically
 * via its own broader working type (see WorkingEntry there) since those field
 * names vary per enum and aren't needed by the matching helpers below.
 */
export interface EnumEntry {
  name: string;
  slug: string;
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

/**
 * Exact match first, then word-order-independent match (sheet has cases like
 * "Green Open Spaces" vs "Open Green Spaces"). Generic so callers passing a
 * wider entry type (e.g. scripts/generate-enums.ts's WorkingEntry, which adds
 * relation-slug arrays beyond the base EnumEntry fields) get that same type
 * back, not the narrower base EnumEntry.
 */
export function matchByName<T extends EnumEntry>(candidates: T[], name: string): T | undefined {
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
export function matchEnumValue<T extends EnumEntry>(candidates: T[], value: string): T | undefined {
  const byName = matchByName(candidates, value);
  if (byName) return byName;
  const bySlug = slugify(value);
  return candidates.find((c) => c.slug === bySlug);
}
