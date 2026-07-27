import { AssetsService } from '../../services/assets.service';
import type { SlugName } from '../types/opportunity-detail.types';

export type { SlugName };

const assets = new AssetsService();

/** snake_case / kebab-case -> Title Case, used only when a value isn't a known enum slug. */
function titleCaseFallback(raw: string): string {
  return raw.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve one enum slug to its human-readable name; unknown slugs fall back to Title Case. */
function resolveName(slug: string): string {
  return assets.getEnumLabel(slug) ?? titleCaseFallback(slug);
}

/** Wrap a single enum slug as `{ name, slug }` — the name is the resolved human-readable label. */
export function toSlugName(slug: string): SlugName {
  const trimmed = slug.trim();
  return { name: resolveName(trimmed), slug: trimmed };
}

/**
 * Resolve a comma-separated slug string (the shape the sheet-to-asset pipeline
 * produces for multi-value enum fields, e.g. "thirty_sixty_mins, one_two_hours")
 * into an array of `{ name, slug }` objects, one per value.
 */
export function toSlugNameList(raw: string | null | undefined): SlugName[] | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts.map(toSlugName) : null;
}
