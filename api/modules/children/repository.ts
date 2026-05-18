import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { batchGetItems } from "../../database/dynamo-helpers.js";
import type { Children, InterestCategory, InterestSubCategory, Parents } from "../../types/db.js";
import type { RequestChildrenCreateDto } from "./dto.js";

function fromDbChild(item: Record<string, unknown>): Children {
  return {
    id: item.id as string,
    nameOrNickName: item.nameOrNickName as string,
    dateOfBirth: new Date(item.dateOfBirth as string),
    parentId: item.parentId as string,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function fromDbParent(item: Record<string, unknown>): Parents {
  return {
    id: item.id as string,
    postCode: item.postCode as string,
    firstNameOrNickName: item.firstNameOrNickName as string,
    latitude: item.latitude as string,
    longitude: item.longitude as string,
    searchRadius: item.searchRadius as number,
    userId: item.userId as string,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function fromDbCategory(item: Record<string, unknown>): Pick<InterestCategory, "id" | "slug" | "name"> {
  return { id: item.id as string, slug: item.slug as string, name: item.name as string };
}

function fromDbSubCategory(
  item: Record<string, unknown>,
): Pick<InterestSubCategory, "id" | "slug" | "name" | "categoryId"> {
  return {
    id: item.id as string,
    slug: item.slug as string,
    name: item.name as string,
    categoryId: item.categoryId as string,
  };
}

async function hydrateChild(item: Record<string, unknown>) {
  const child = fromDbChild(item);
  const categoryIds = (item.interestCategoryIds as string[]) ?? [];
  const subCategoryIds = (item.interestSubCategoryIds as string[]) ?? [];

  const [parentRes, categoryItems, subCategoryItems] = await Promise.all([
    db.send(new GetCommand({ TableName: TABLES.parents, Key: { id: child.parentId } })),
    categoryIds.length > 0 ? batchGetItems(TABLES.interestCategories, categoryIds) : Promise.resolve([]),
    subCategoryIds.length > 0
      ? batchGetItems(TABLES.interestSubCategories, subCategoryIds)
      : Promise.resolve([]),
  ]);

  const parent = parentRes.Item ? fromDbParent(parentRes.Item as Record<string, unknown>) : null;
  const interestCategories = categoryItems
    .map((i: Record<string, unknown>) => fromDbCategory(i))
    .sort((a: { slug: string }, b: { slug: string }) => a.slug.localeCompare(b.slug));
  const interestSubCategories = subCategoryItems
    .map((i: Record<string, unknown>) => fromDbSubCategory(i))
    .sort((a: { slug: string }, b: { slug: string }) => a.slug.localeCompare(b.slug));

  return { ...child, parent, interestCategories, interestSubCategories };
}

export class ChildrenRepository {
  async getById(id: string) {
    const res = await db.send(new GetCommand({ TableName: TABLES.children, Key: { id } }));
    if (!res.Item) return null;
    return hydrateChild(res.Item as Record<string, unknown>);
  }

  async interestCategoriesExist(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    const unique = [...new Set(ids)];
    const items = await batchGetItems(TABLES.interestCategories, unique);
    return items.length === unique.length;
  }

  async findInterestSubCategoriesByIds(ids: string[]): Promise<{ id: string; categoryId: string }[]> {
    if (ids.length === 0) return [];
    const items = await batchGetItems(TABLES.interestSubCategories, ids);
    return items.map((i: Record<string, unknown>) => ({
      id: i.id as string,
      categoryId: i.categoryId as string,
    }));
  }

  async create(dto: RequestChildrenCreateDto): Promise<string[]> {
    if (!dto.children?.length) return [];
    const now = new Date().toISOString();
    const ids: string[] = [];

    await Promise.all(
      dto.children.map((child) => {
        const id = uuidv4();
        ids.push(id);
        return db.send(
          new PutCommand({
            TableName: TABLES.children,
            Item: {
              id,
              parentId: dto.parentId,
              nameOrNickName: child.nameOrNickName,
              dateOfBirth: new Date(child.dateOfBirth).toISOString(),
              interestCategoryIds: [],
              interestSubCategoryIds: [],
              skillIds: [],
              createdAt: now,
              updatedAt: now,
            },
          }),
        );
      }),
    );

    return ids;
  }

  async updateInterestPreferences(childId: string, categoryIds: string[], subCategoryIds: string[]) {
    const now = new Date().toISOString();
    await db.send(
      new UpdateCommand({
        TableName: TABLES.children,
        Key: { id: childId },
        UpdateExpression:
          "SET interestCategoryIds = :cats, interestSubCategoryIds = :subs, updatedAt = :ua",
        ExpressionAttributeValues: {
          ":cats": categoryIds,
          ":subs": subCategoryIds,
          ":ua": now,
        },
      }),
    );
    const res = await db.send(new GetCommand({ TableName: TABLES.children, Key: { id: childId } }));
    if (!res.Item) return null;
    return hydrateChild(res.Item as Record<string, unknown>);
  }

  async getByParentId(parentId: string): Promise<Children[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.children,
        IndexName: "parentId-index",
        KeyConditionExpression: "parentId = :pid",
        ExpressionAttributeValues: { ":pid": parentId },
      }),
    );
    return (res.Items ?? []).map((i: Record<string, unknown>) => fromDbChild(i));
  }
}
