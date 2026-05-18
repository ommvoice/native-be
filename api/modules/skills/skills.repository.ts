import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { scanAll, batchGetItems } from "../../database/dynamo-helpers.js";
import type { InterestCategory, InterestSubCategory, Skill } from "../../types/db.js";

type SubWithCategory = InterestSubCategory & { category: InterestCategory };
type SkillWithSub = Skill & { subCategory: SubWithCategory | null };

function interestGroupFromBucket(bucket: SkillWithSub[]) {
  const sub = bucket[0]!.subCategory!;
  const skills = bucket.map(({ subCategory: _sc, ...skill }) => skill);
  return {
    id: sub.id,
    slug: sub.slug,
    type: "INTEREST_BASED" as const,
    label: sub.name,
    subCategoryId: sub.id,
    skills,
    subCategory: sub,
  };
}

function fromDbSkill(item: Record<string, unknown>): Skill {
  return {
    id: item.id as string,
    slug: item.slug as string,
    label: item.label as string,
    description: item.description as string,
    type: item.type as Skill["type"],
    subCategoryId: (item.subCategoryId as string | null) ?? null,
    minAge: (item.minAge as number | null) ?? null,
    maxAge: (item.maxAge as number | null) ?? null,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function fromDbSubCategory(item: Record<string, unknown>): InterestSubCategory {
  return {
    id: item.id as string,
    slug: item.slug as string,
    name: item.name as string,
    suitableForAge: (item.suitableForAge as string | null) ?? null,
    categoryId: item.categoryId as string,
    parentId: (item.parentId as string | null) ?? null,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function fromDbCategory(item: Record<string, unknown>): InterestCategory {
  return {
    id: item.id as string,
    slug: item.slug as string,
    name: item.name as string,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class SkillRepository {
  async getInterestBased() {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.skills,
        IndexName: "type-index",
        KeyConditionExpression: "#type = :type",
        ExpressionAttributeNames: { "#type": "type" },
        ExpressionAttributeValues: { ":type": "INTEREST_BASED" },
      }),
    );
    const rows = (res.Items ?? []).map((i) => fromDbSkill(i as Record<string, unknown>));

    const subCategoryIds = [...new Set(rows.map((r) => r.subCategoryId).filter(Boolean) as string[])];
    const subItems = subCategoryIds.length > 0 ? await batchGetItems(TABLES.interestSubCategories, subCategoryIds) : [];
    const subMap = new Map(subItems.map((i) => [i.id as string, fromDbSubCategory(i as Record<string, unknown>)]));

    const categoryIds = [...new Set(subItems.map((i) => i.categoryId as string))];
    const catItems = categoryIds.length > 0 ? await batchGetItems(TABLES.interestCategories, categoryIds) : [];
    const catMap = new Map(catItems.map((i) => [i.id as string, fromDbCategory(i as Record<string, unknown>)]));

    const enriched: SkillWithSub[] = rows
      .filter((r) => r.subCategoryId && subMap.has(r.subCategoryId))
      .map((r) => {
        const sub = subMap.get(r.subCategoryId!)!;
        const cat = catMap.get(sub.categoryId)!;
        return { ...r, subCategory: { ...sub, category: cat } };
      })
      .sort((a, b) => {
        const subCmp = (a.subCategoryId ?? "").localeCompare(b.subCategoryId ?? "");
        return subCmp !== 0 ? subCmp : a.label.localeCompare(b.label);
      });

    const map = new Map<string, SkillWithSub[]>();
    for (const row of enriched) {
      if (!row.subCategoryId) continue;
      const list = map.get(row.subCategoryId) ?? [];
      list.push(row);
      map.set(row.subCategoryId, list);
    }
    return [...map.values()].map(interestGroupFromBucket);
  }

  async getAgeBased() {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.skills,
        IndexName: "type-index",
        KeyConditionExpression: "#type = :type",
        ExpressionAttributeNames: { "#type": "type" },
        ExpressionAttributeValues: { ":type": "AGE_BASED" },
      }),
    );
    const skills = (res.Items ?? [])
      .map((i) => fromDbSkill(i as Record<string, unknown>))
      .sort((a, b) => a.label.localeCompare(b.label));

    return skills.map((s) => ({
      id: s.id,
      slug: s.slug,
      type: "AGE_BASED" as const,
      label: s.label,
      subCategoryId: null as string | null,
      skills: [s],
      subCategory: null,
    }));
  }

  async getAll() {
    const [interest, age] = await Promise.all([this.getInterestBased(), this.getAgeBased()]);
    return [...interest, ...age];
  }

  async getLevels() {
    const items = await scanAll(TABLES.skillLevels);
    return items
      .map((i) => ({
        id: i.id as number,
        label: i.label as string,
        description: i.description as string,
        createdAt: new Date(i.createdAt as string),
        updatedAt: new Date(i.updatedAt as string),
      }))
      .sort((a, b) => a.id - b.id);
  }
}
