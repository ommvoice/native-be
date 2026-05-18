import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { scanAll } from "../../database/dynamo-helpers.js";
import type { InterestCategoryResponse, InterestSubCategoryResponse } from "./types.js";

type FlatSubCategory = {
  id: string;
  slug: string;
  name: string;
  suitableForAge: string | null;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
};

function buildSubCategoryTree(flat: FlatSubCategory[]): InterestSubCategoryResponse[] {
  const nodes = new Map<string, InterestSubCategoryResponse>();
  for (const row of flat) {
    nodes.set(row.id, {
      id: row.id,
      slug: row.slug,
      name: row.name,
      suitableForAge: row.suitableForAge,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      subCategories: [],
    });
  }

  const roots: InterestSubCategoryResponse[] = [];
  for (const row of flat) {
    const node = nodes.get(row.id);
    if (!node) continue;
    if (row.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodes.get(row.parentId);
      if (parent) {
        parent.subCategories.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  const sortBySlug = (list: InterestSubCategoryResponse[]) => {
    list.sort((a, b) => a.slug.localeCompare(b.slug));
    for (const n of list) sortBySlug(n.subCategories);
  };
  sortBySlug(roots);

  return roots;
}

export class InterestRepository {
  async getAll(): Promise<InterestCategoryResponse[]> {
    const [categoryItems, subItems] = await Promise.all([
      scanAll(TABLES.interestCategories),
      scanAll(TABLES.interestSubCategories),
    ]);

    const subsByCategoryId = new Map<string, FlatSubCategory[]>();
    for (const item of subItems) {
      const flat: FlatSubCategory = {
        id: item.id as string,
        slug: item.slug as string,
        name: item.name as string,
        suitableForAge: (item.suitableForAge as string | null) ?? null,
        parentId: (item.parentId as string | null) ?? null,
        createdAt: new Date(item.createdAt as string),
        updatedAt: new Date(item.updatedAt as string),
      };
      const catId = item.categoryId as string;
      const list = subsByCategoryId.get(catId) ?? [];
      list.push(flat);
      subsByCategoryId.set(catId, list);
    }

    const categories: InterestCategoryResponse[] = categoryItems
      .map((item) => ({
        id: item.id as string,
        slug: item.slug as string,
        name: item.name as string,
        createdAt: new Date(item.createdAt as string),
        updatedAt: new Date(item.updatedAt as string),
        subCategories: buildSubCategoryTree(subsByCategoryId.get(item.id as string) ?? []),
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));

    return categories;
  }

  async getSubCategoriesByCategoryId(categoryId: string): Promise<FlatSubCategory[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.interestSubCategories,
        IndexName: "categoryId-index",
        KeyConditionExpression: "categoryId = :cid",
        ExpressionAttributeValues: { ":cid": categoryId },
      }),
    );
    return (res.Items ?? []).map((item) => ({
      id: item.id as string,
      slug: item.slug as string,
      name: item.name as string,
      suitableForAge: (item.suitableForAge as string | null) ?? null,
      parentId: (item.parentId as string | null) ?? null,
      createdAt: new Date(item.createdAt as string),
      updatedAt: new Date(item.updatedAt as string),
    }));
  }
}

export type InterestCategoryRow = Awaited<ReturnType<InterestRepository["getAll"]>>[number];
