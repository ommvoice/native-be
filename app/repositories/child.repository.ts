import { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { v4 as uuidv4 } from 'uuid';

export interface ChildRecord {
  id: string;
  nameOrNickName: string;
  dateOfBirth: string;
  parentId: string;
  skillIds: string[];
  interestCategoryIds: string[];
  interestSubCategoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class ChildRepository {
  async getById(id: string): Promise<ChildRecord | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.children, Key: { id } }));
    return (res.Item as ChildRecord) ?? null;
  }

  async listByParentId(parentId: string): Promise<ChildRecord[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.children,
        IndexName: 'parentId-index',
        KeyConditionExpression: 'parentId = :pid',
        ExpressionAttributeValues: { ':pid': parentId },
      }),
    );
    return (res.Items ?? []) as ChildRecord[];
  }

  async create(data: Omit<ChildRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChildRecord> {
    const now = new Date().toISOString();
    const record: ChildRecord = { id: uuidv4(), createdAt: now, updatedAt: now, ...data };
    await db.send(new PutCommand({ TableName: TABLES.children, Item: record }));
    return record;
  }

  async update(id: string, data: Partial<Pick<ChildRecord, 'nameOrNickName' | 'dateOfBirth' | 'skillIds'>>): Promise<void> {
    const now = new Date().toISOString();
    const sets: string[] = ['updatedAt = :ua'];
    const vals: Record<string, unknown> = { ':ua': now };

    if (data.nameOrNickName !== undefined) { sets.push('nameOrNickName = :n'); vals[':n'] = data.nameOrNickName; }
    if (data.dateOfBirth !== undefined)    { sets.push('dateOfBirth = :d');    vals[':d'] = data.dateOfBirth; }
    if (data.skillIds !== undefined)       { sets.push('skillIds = :s');        vals[':s'] = data.skillIds; }

    await db.send(
      new UpdateCommand({
        TableName: TABLES.children,
        Key: { id },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeValues: vals,
      }),
    );
  }

  async updateInterests(id: string, categoryIds: string[], subCategoryIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    await db.send(
      new UpdateCommand({
        TableName: TABLES.children,
        Key: { id },
        UpdateExpression: 'SET interestCategoryIds = :cats, interestSubCategoryIds = :subs, updatedAt = :ua',
        ExpressionAttributeValues: { ':cats': categoryIds, ':subs': subCategoryIds, ':ua': now },
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await db.send(new DeleteCommand({ TableName: TABLES.children, Key: { id } }));
  }
}
