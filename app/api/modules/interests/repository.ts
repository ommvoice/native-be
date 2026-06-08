import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { scanAll } from "../../database/dynamo-helpers.js";
import { groupThemeRowsByKey, pickCanonicalThemeRow } from "../../lib/opportunity-theme-helpers.js";
import type { InterestCategoryResponse, InterestThemeResponse } from "./types.js";

function mapTheme(item: Record<string, unknown>): InterestThemeResponse {
  return {
    id: item.id as string,
    slug: item.slug as string,
    name: item.name as string,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function dedupeThemesBySlug(items: Record<string, unknown>[]): InterestThemeResponse[] {
  const themes: { sortOrder: number; theme: InterestThemeResponse }[] = [];
  for (const rows of groupThemeRowsByKey(items).values()) {
    const canonical = pickCanonicalThemeRow(rows);
    if (canonical) {
      themes.push({
        sortOrder: Number(canonical.sortOrder ?? 0),
        theme: mapTheme(canonical),
      });
    }
  }
  return themes
    .sort((a, b) => a.sortOrder - b.sortOrder || a.theme.slug.localeCompare(b.theme.slug))
    .map((t) => t.theme);
}

export class InterestRepository {
  async getAll(): Promise<InterestCategoryResponse[]> {
    const [categoryItems, themeItems] = await Promise.all([
      scanAll(TABLES.interestCategories),
      scanAll(TABLES.opportunityThemes),
    ]);

    const themesByInterestId = new Map<string, Record<string, unknown>[]>();
    for (const item of themeItems) {
      const interestId = item.interestId as string | undefined;
      if (!interestId) continue;
      const list = themesByInterestId.get(interestId) ?? [];
      list.push(item);
      themesByInterestId.set(interestId, list);
    }

    const categories: InterestCategoryResponse[] = categoryItems
      .map((item) => ({
        id: item.id as string,
        slug: item.slug as string,
        name: item.name as string,
        createdAt: new Date(item.createdAt as string),
        updatedAt: new Date(item.updatedAt as string),
        themes: dedupeThemesBySlug(themesByInterestId.get(item.id as string) ?? []),
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));

    return categories;
  }

  async getThemesByCategoryId(categoryId: string): Promise<InterestThemeResponse[]> {
    const themeItems = await scanAll(TABLES.opportunityThemes);
    return dedupeThemesBySlug(
      themeItems.filter((t) => (t.interestId as string) === categoryId),
    );
  }
}

export type InterestCategoryRow = Awaited<ReturnType<InterestRepository["getAll"]>>[number];
