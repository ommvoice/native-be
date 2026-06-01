import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { scanAll } from "../../database/dynamo-helpers.js";
import { groupThemeRowsByKey, pickCanonicalThemeRow } from "../../lib/opportunity-theme-helpers.js";
import type {
  OpportunityThemeResponse,
  OpportunityThemeVariantResponse,
  ThemeListFilters,
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

function buildThemeResponse(
  rows: Record<string, unknown>[],
  variantsByThemeId: Map<string, OpportunityThemeVariantResponse[]>,
): OpportunityThemeResponse | null {
  const canonical = pickCanonicalThemeRow(rows);
  if (!canonical) return null;

  const themeIds = new Set(rows.map((r) => r.id as string));
  const variants: OpportunityThemeVariantResponse[] = [];
  const seenVariantSlugs = new Set<string>();

  for (const themeId of themeIds) {
    for (const v of variantsByThemeId.get(themeId) ?? []) {
      if (seenVariantSlugs.has(v.slug)) continue;
      seenVariantSlugs.add(v.slug);
      variants.push(v);
    }
  }

  variants.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));

  const interestId = (canonical.interestId as string | undefined) ?? null;

  return {
    id: canonical.id as string,
    slug: canonical.slug as string,
    name: canonical.name as string,
    interestId,
    isActive: rows.every((r) => Boolean(r.isActive)),
    sortOrder: Number(canonical.sortOrder ?? 0),
    createdAt: new Date(canonical.createdAt as string),
    updatedAt: new Date(canonical.updatedAt as string),
    variants,
  };
}

export class ThemeRepository {
  async resolveInterestId(filters: ThemeListFilters): Promise<string | undefined> {
    if (filters.interestId) return filters.interestId;
    if (!filters.interestSlug) return undefined;

    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.interestCategories,
        IndexName: "slug-index",
        KeyConditionExpression: "slug = :slug",
        ExpressionAttributeValues: { ":slug": filters.interestSlug },
        Limit: 1,
      }),
    );
    return res.Items?.[0]?.id as string | undefined;
  }

  async getAll(filters: ThemeListFilters = {}): Promise<OpportunityThemeResponse[]> {
    const linkedOnly = filters.linkedOnly !== false;
    const interestId = await this.resolveInterestId(filters);

    const [allThemes, variantItems] = await Promise.all([
      scanAll(TABLES.opportunityThemes),
      scanAll(TABLES.opportunityThemeVariants),
    ]);
    const themeItems = interestId
      ? allThemes.filter((t) => (t.interestId as string) === interestId)
      : allThemes;

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

    let filteredThemes = themeItems;
    if (interestId) {
      filteredThemes = themeItems.filter((t) => (t.interestId as string) === interestId);
    } else if (filters.interestSlug) {
      return [];
    } else if (linkedOnly) {
      filteredThemes = themeItems.filter((t) => t.interestId != null && t.interestId !== "");
    }

    const themes: OpportunityThemeResponse[] = [];
    for (const rows of groupThemeRowsByKey(filteredThemes).values()) {
      const theme = buildThemeResponse(rows, variantsByThemeId);
      if (theme) themes.push(theme);
    }

    themes.sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
    return themes;
  }
}
