import { TABLES } from "../../database/tables.js";
import { scanAll } from "../../database/dynamo-helpers.js";
import type {
  OpportunityRecordType,
  OpportunityThemeResponse,
  OpportunityThemeVariantResponse,
} from "./types.js";

function mapVariant(item: Record<string, unknown>): OpportunityThemeVariantResponse {
  return {
    id: item.id as string,
    slug: item.slug as string,
    name: item.name as string,
    applicableTypes: (item.applicableTypes as string | null) ?? null,
    description: (item.description as string | null) ?? null,
    isActive: Boolean(item.isActive),
    sortOrder: Number(item.sortOrder ?? 0),
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class ThemeRepository {
  async getAll(): Promise<OpportunityThemeResponse[]> {
    const [themeItems, variantItems] = await Promise.all([
      scanAll(TABLES.opportunityThemes),
      scanAll(TABLES.opportunityThemeVariants),
    ]);

    const variantsByThemeId = new Map<string, OpportunityThemeVariantResponse[]>();
    for (const raw of variantItems) {
      const themeId = raw.themeId as string;
      const v = mapVariant(raw);
      const list = variantsByThemeId.get(themeId) ?? [];
      list.push(v);
      variantsByThemeId.set(themeId, list);
    }

    for (const list of variantsByThemeId.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
    }

    const themes: OpportunityThemeResponse[] = themeItems.map((item) => ({
      id: item.id as string,
      slug: item.slug as string,
      name: item.name as string,
      recordType: item.recordType as OpportunityRecordType,
      isActive: Boolean(item.isActive),
      sortOrder: Number(item.sortOrder ?? 0),
      createdAt: new Date(item.createdAt as string),
      updatedAt: new Date(item.updatedAt as string),
      variants: variantsByThemeId.get(item.id as string) ?? [],
    }));

    themes.sort(
      (a, b) =>
        a.slug.localeCompare(b.slug) ||
        a.recordType.localeCompare(b.recordType) ||
        a.sortOrder - b.sortOrder,
    );

    return themes;
  }
}
