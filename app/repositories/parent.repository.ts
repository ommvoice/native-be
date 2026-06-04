import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { batchGetItems } from '../shared/db/dynamo-helpers';
import { v4 as uuidv4 } from 'uuid';

export interface ParentRecord {
  id: string;
  firstNameOrNickName: string;
  postCode: string;
  latitude: string;
  longitude: string;
  searchRadius: number;
  userId: string;
  interestCategoryIds: string[];
  interestSubCategoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class ParentRepository {
  async getById(id: string): Promise<ParentRecord | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.parents, Key: { id } }));
    return (res.Item as ParentRecord) ?? null;
  }

  async getByUserId(userId: string): Promise<ParentRecord | null> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.parents,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        Limit: 1,
      }),
    );
    return (res.Items?.[0] as ParentRecord) ?? null;
  }

  async create(data: Omit<ParentRecord, 'id' | 'interestCategoryIds' | 'interestSubCategoryIds' | 'createdAt' | 'updatedAt'>): Promise<ParentRecord> {
    const now = new Date().toISOString();
    const record: ParentRecord = {
      id: uuidv4(),
      interestCategoryIds: [],
      interestSubCategoryIds: [],
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    await db.send(new PutCommand({ TableName: TABLES.parents, Item: record }));
    return record;
  }

  async updateSearchRadius(id: string, searchRadius: number): Promise<void> {
    const now = new Date().toISOString();
    await db.send(
      new UpdateCommand({
        TableName: TABLES.parents,
        Key: { id },
        UpdateExpression: 'SET searchRadius = :sr, updatedAt = :ua',
        ExpressionAttributeValues: { ':sr': searchRadius, ':ua': now },
      }),
    );
  }

  async updateInterests(id: string, categoryIds: string[], subCategoryIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    await db.send(
      new UpdateCommand({
        TableName: TABLES.parents,
        Key: { id },
        UpdateExpression: 'SET interestCategoryIds = :cats, interestSubCategoryIds = :subs, updatedAt = :ua',
        ExpressionAttributeValues: { ':cats': categoryIds, ':subs': subCategoryIds, ':ua': now },
      }),
    );
  }

  async interestCategoryIdsExist(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    const items = await batchGetItems(TABLES.interestCategories, ids);
    return items.length === new Set(ids).size;
  }

  async getThemesByIds(ids: string[]): Promise<{ id: string; categoryId: string }[]> {
    if (ids.length === 0) return [];
    const items = await batchGetItems(TABLES.opportunityThemes, ids);
    return items.map((i) => ({ id: i.id as string, categoryId: i.interestId as string }));
  }
}
