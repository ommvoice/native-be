import { DeleteCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../config/index.js";
import { TABLES } from "../config/index.js";

export type VariantRow = {
  slug: string;
  name: string;
  applicableTypes?: string;
  description?: string;
  isActive?: boolean;
};

export type CategoryThemeRow = {
  slug: string;
  name: string;
};

async function scanAll(tableName: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new ScanCommand({ TableName: tableName, ...(lastKey ? { ExclusiveStartKey: lastKey } : {}) }),
    );
    items.push(...((res.Items ?? []) as Record<string, unknown>[]));
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
  return items;
}

export async function findInterestCategoryIdBySlug(slug: string): Promise<string> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.interestCategories,
      IndexName: "slug-index",
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: { ":slug": slug },
      Limit: 1,
    }),
  );
  const id = res.Items?.[0]?.id as string | undefined;
  if (!id) {
    throw new Error(`Interest category not found: ${slug}. Run seed:interests first.`);
  }
  return id;
}

async function deleteThemeRowsAndVariants(themeIds: string[]): Promise<void> {
  if (themeIds.length === 0) return;

  const variantItems = await scanAll(TABLES.opportunityThemeVariants);
  for (const variant of variantItems) {
    if (themeIds.includes(variant.themeId as string)) {
      await db.send(
        new DeleteCommand({ TableName: TABLES.opportunityThemeVariants, Key: { id: variant.id } }),
      );
    }
  }

  for (const themeId of themeIds) {
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityThemes, Key: { id: themeId } }));
  }
}

async function deleteThemesForInterest(interestId: string): Promise<void> {
  const themeItems = await scanAll(TABLES.opportunityThemes);
  const themeIds = themeItems
    .filter((t) => (t.interestId as string | undefined) === interestId)
    .map((t) => t.id as string);
  await deleteThemeRowsAndVariants(themeIds);
}

/** Deletes every row in `opportunity-theme-variants`. */
export async function clearAllThemeVariants(): Promise<number> {
  const items = await scanAll(TABLES.opportunityThemeVariants);
  for (const item of items) {
    await db.send(
      new DeleteCommand({ TableName: TABLES.opportunityThemeVariants, Key: { id: item.id } }),
    );
  }
  return items.length;
}

export async function findThemeIdByInterestAndSlug(
  categorySlug: string,
  themeSlug: string,
): Promise<string> {
  const interestId = await findInterestCategoryIdBySlug(categorySlug);
  const themeItems = await scanAll(TABLES.opportunityThemes);
  const match = themeItems.find(
    (t) => (t.interestId as string) === interestId && (t.slug as string) === themeSlug,
  );
  const id = match?.id as string | undefined;
  if (!id) {
    throw new Error(`Theme not found: ${categorySlug}/${themeSlug}. Run category theme seed first.`);
  }
  return id;
}

/** Replace variants for one theme (keeps the theme row; looks up `themeId` by category + slug). */
export async function replaceVariantsForTheme(params: {
  categorySlug: string;
  themeSlug: string;
  variants: VariantRow[];
}): Promise<void> {
  const themeId = await findThemeIdByInterestAndSlug(params.categorySlug, params.themeSlug);
  const existing = await scanAll(TABLES.opportunityThemeVariants);
  for (const row of existing) {
    if ((row.themeId as string) === themeId) {
      await db.send(
        new DeleteCommand({ TableName: TABLES.opportunityThemeVariants, Key: { id: row.id } }),
      );
    }
  }

  const now = new Date().toISOString();
  for (let sortOrder = 0; sortOrder < params.variants.length; sortOrder++) {
    const v = params.variants[sortOrder]!;
    await db.send(
      new PutCommand({
        TableName: TABLES.opportunityThemeVariants,
        Item: {
          id: uuidv4(),
          themeId,
          slug: v.slug,
          name: v.name,
          applicableTypes: v.applicableTypes ?? null,
          description: v.description ?? null,
          isActive: v.isActive ?? true,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }

  console.log(
    `  Seeded ${params.variants.length} variants for ${params.categorySlug}/${params.themeSlug} (themeId: ${themeId}).`,
  );
}

/** Removes legacy rows seeded before interest-linked themes (no `interestId`). */
export async function clearLegacyThemesWithoutInterest(): Promise<number> {
  const themeItems = await scanAll(TABLES.opportunityThemes);
  const legacyIds = themeItems
    .filter((t) => t.interestId == null || t.interestId === "")
    .map((t) => t.id as string);
  await deleteThemeRowsAndVariants(legacyIds);
  return legacyIds.length;
}

export async function seedCategoryThemes(params: {
  categorySlug: string;
  themes: CategoryThemeRow[];
  variantsByTheme: Record<string, VariantRow[]>;
  replaceExisting?: boolean;
  clearLegacyUnlinked?: boolean;
}): Promise<void> {
  const {
    categorySlug,
    themes,
    variantsByTheme,
    replaceExisting = true,
    clearLegacyUnlinked = false,
  } = params;
  const interestId = await findInterestCategoryIdBySlug(categorySlug);

  if (clearLegacyUnlinked) {
    const removed = await clearLegacyThemesWithoutInterest();
    if (removed > 0) {
      console.log(`  Removed ${removed} legacy opportunity theme row(s) without interestId.`);
    }
  }

  if (replaceExisting) {
    await deleteThemesForInterest(interestId);
  }

  const now = new Date().toISOString();
  const themeIdBySlug = new Map<string, string>();
  let variantCount = 0;

  for (let sortOrder = 0; sortOrder < themes.length; sortOrder++) {
    const theme = themes[sortOrder]!;
    const id = uuidv4();
    themeIdBySlug.set(theme.slug, id);

    await db.send(
      new PutCommand({
        TableName: TABLES.opportunityThemes,
        Item: {
          id,
          slug: theme.slug,
          name: theme.name,
          interestId,
          isActive: true,
          sortOrder,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }

  for (const [themeSlug, variants] of Object.entries(variantsByTheme)) {
    const themeId = themeIdBySlug.get(themeSlug);
    if (!themeId) {
      console.warn(`Skipping variants for unknown theme slug: ${themeSlug}`);
      continue;
    }

    for (let sortOrder = 0; sortOrder < variants.length; sortOrder++) {
      const v = variants[sortOrder]!;
      await db.send(
        new PutCommand({
          TableName: TABLES.opportunityThemeVariants,
          Item: {
            id: uuidv4(),
            themeId,
            slug: v.slug,
            name: v.name,
            applicableTypes: v.applicableTypes ?? null,
            description: v.description ?? null,
            isActive: v.isActive ?? true,
            sortOrder,
            createdAt: now,
            updatedAt: now,
          },
        }),
      );
      variantCount++;
    }
  }

  console.log(
    `  Seeded ${themes.length} themes and ${variantCount} variants for interest category "${categorySlug}".`,
  );
}
