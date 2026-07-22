import { AssetsService } from '../services/assets.service';

export interface ThemeRecord {
  id: string;
  slug: string;
  name: string;
  interestId: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeVariantRecord {
  id: string;
  slug: string;
  name: string;
  themeId: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ThemeRepository {
  private readonly assets = new AssetsService();

  async listThemes(): Promise<ThemeRecord[]> {
    return this.assets.getThemes();
  }

  async listVariants(themeSlug?: string): Promise<ThemeVariantRecord[]> {
    return this.assets.getThemeVariants(themeSlug);
  }

  async getThemesBySlugs(slugs: string[]): Promise<ThemeRecord[]> {
    const set = new Set(slugs);
    return this.assets.getThemes().filter((t) => set.has(t.slug));
  }

  async getVariantsBySlugs(slugs: string[]): Promise<ThemeVariantRecord[]> {
    const set = new Set(slugs);
    return this.assets.getThemeVariants().filter((v) => set.has(v.slug));
  }
}
