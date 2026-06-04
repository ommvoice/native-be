import { scanAll, batchGetItems } from '../shared/db/dynamo-helpers';
import { TABLES } from '../shared/db/tables';

export interface ThemeRecord {
  id: string;
  slug: string;
  name: string;
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
  async listThemes(): Promise<ThemeRecord[]> {
    const items = await scanAll(TABLES.opportunityThemes);
    return items as ThemeRecord[];
  }

  async listVariants(themeId?: string): Promise<ThemeVariantRecord[]> {
    const items = await scanAll(TABLES.opportunityThemeVariants);
    const all = items as ThemeVariantRecord[];
    return themeId ? all.filter((v) => v.themeId === themeId) : all;
  }

  async getThemesByIds(ids: string[]): Promise<ThemeRecord[]> {
    const items = await batchGetItems(TABLES.opportunityThemes, ids);
    return items as ThemeRecord[];
  }

  async getVariantsByIds(ids: string[]): Promise<ThemeVariantRecord[]> {
    const items = await batchGetItems(TABLES.opportunityThemeVariants, ids);
    return items as ThemeVariantRecord[];
  }
}
