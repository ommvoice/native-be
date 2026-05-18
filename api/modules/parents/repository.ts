import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { batchGetItems } from "../../database/dynamo-helpers.js";
import type { Children, InterestCategory, InterestSubCategory, Parents, Users } from "../../types/db.js";

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

function fromDbUser(item: Record<string, unknown>): Users {
  return {
    id: item.id as string,
    email: item.email as string,
    sub: item.sub as string,
    role: item.role as Users["role"],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

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

async function resolveCategories(ids: string[]) {
  if (ids.length === 0) return [];
  const items = await batchGetItems(TABLES.interestCategories, ids);
  return items.map(fromDbCategory).sort((a, b) => a.slug.localeCompare(b.slug));
}

async function resolveSubCategories(ids: string[]) {
  if (ids.length === 0) return [];
  const items = await batchGetItems(TABLES.interestSubCategories, ids);
  return items.map(fromDbSubCategory).sort((a, b) => a.slug.localeCompare(b.slug));
}

async function getChildrenForParent(parentId: string): Promise<Children[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.children,
      IndexName: "parentId-index",
      KeyConditionExpression: "parentId = :pid",
      ExpressionAttributeValues: { ":pid": parentId },
    }),
  );
  return (res.Items ?? []).map((i) => fromDbChild(i as Record<string, unknown>));
}

async function hydrateParent(item: Record<string, unknown>) {
  const parent = fromDbParent(item);
  const categoryIds = (item.interestCategoryIds as string[]) ?? [];
  const subCategoryIds = (item.interestSubCategoryIds as string[]) ?? [];

  const [userRes, children, interestCategories, interestSubCategories] = await Promise.all([
    db.send(new GetCommand({ TableName: TABLES.users, Key: { id: parent.userId } })),
    getChildrenForParent(parent.id),
    resolveCategories(categoryIds),
    resolveSubCategories(subCategoryIds),
  ]);

  const user = userRes.Item ? fromDbUser(userRes.Item as Record<string, unknown>) : null;

  return { ...parent, user, children, interestCategories, interestSubCategories };
}

async function hydrateParentWithoutUser(item: Record<string, unknown>) {
  const parent = fromDbParent(item);
  const categoryIds = (item.interestCategoryIds as string[]) ?? [];
  const subCategoryIds = (item.interestSubCategoryIds as string[]) ?? [];

  const [children, interestCategories, interestSubCategories] = await Promise.all([
    getChildrenForParent(parent.id),
    resolveCategories(categoryIds),
    resolveSubCategories(subCategoryIds),
  ]);

  return { ...parent, children, interestCategories, interestSubCategories };
}

export class ParentRepository {
  async getById(id: string) {
    const res = await db.send(new GetCommand({ TableName: TABLES.parents, Key: { id } }));
    if (!res.Item) return null;
    return hydrateParent(res.Item as Record<string, unknown>);
  }

  async getByUserId(userId: string) {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.parents,
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        Limit: 1,
      }),
    );
    const item = res.Items?.[0];
    if (!item) return null;
    return hydrateParentWithoutUser(item as Record<string, unknown>);
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
    return items.map((i: Record<string, unknown>) => ({ id: i.id as string, categoryId: i.categoryId as string }));
  }

  async updateSearchRadius(id: string, searchRadius: number) {
    const now = new Date().toISOString();
    await db.send(
      new UpdateCommand({
        TableName: TABLES.parents,
        Key: { id },
        UpdateExpression: "SET searchRadius = :sr, updatedAt = :ua",
        ExpressionAttributeValues: { ":sr": searchRadius, ":ua": now },
      }),
    );
  }

  async updateInterestPreferences(parentId: string, categoryIds: string[], subCategoryIds: string[]) {
    const now = new Date().toISOString();
    await db.send(
      new UpdateCommand({
        TableName: TABLES.parents,
        Key: { id: parentId },
        UpdateExpression:
          "SET interestCategoryIds = :cats, interestSubCategoryIds = :subs, updatedAt = :ua",
        ExpressionAttributeValues: {
          ":cats": categoryIds,
          ":subs": subCategoryIds,
          ":ua": now,
        },
      }),
    );
    return this.getById(parentId);
  }

  async createParent(data: {
    id: string;
    firstNameOrNickName: string;
    postCode: string;
    latitude: string;
    longitude: string;
    searchRadius: number;
    userId: string;
  }) {
    const now = new Date().toISOString();
    await db.send(
      new PutCommand({
        TableName: TABLES.parents,
        Item: {
          ...data,
          interestCategoryIds: [],
          interestSubCategoryIds: [],
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }
}
