import type { ThemeRepository } from "./repository.js";
import type { OpportunityThemeResponse } from "./types.js";

export class ThemeService {
  constructor(private themeRepository: ThemeRepository) {}

  async getAll(): Promise<OpportunityThemeResponse[]> {
    const rows = await this.themeRepository.getAll();
    const bySlug = new Map<string, OpportunityThemeResponse>();
    for (const row of rows) {
      const prev = bySlug.get(row.slug);
      if (!prev || row.variants.length > prev.variants.length) {
        bySlug.set(row.slug, row);
      }
    }
    return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
  }
}
