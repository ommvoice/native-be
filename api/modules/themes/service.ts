import type { ThemeRepository } from "./repository.js";
import type { OpportunityThemeResponse, ThemeListFilters } from "./types.js";

export class ThemeService {
  constructor(private themeRepository: ThemeRepository) {}

  async getAll(filters: ThemeListFilters = {}): Promise<OpportunityThemeResponse[]> {
    return this.themeRepository.getAll(filters);
  }
}
