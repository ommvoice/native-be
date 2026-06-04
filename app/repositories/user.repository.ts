import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'ADMIN' | 'PARENT' | 'PROVIDER';

export interface UserRecord {
  id: string;
  email: string;
  sub: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export class UserRepository {
  async getBySub(sub: string): Promise<UserRecord | null> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.users,
        IndexName: 'sub-index',
        KeyConditionExpression: '#sub = :sub',
        ExpressionAttributeNames: { '#sub': 'sub' },
        ExpressionAttributeValues: { ':sub': sub },
        Limit: 1,
      }),
    );
    return (res.Items?.[0] as UserRecord) ?? null;
  }

  async getById(id: string): Promise<UserRecord | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.users, Key: { id } }));
    return (res.Item as UserRecord) ?? null;
  }

  async upsertBySub(sub: string, email: string): Promise<UserRecord> {
    const existing = await this.getBySub(sub);
    if (existing) {
      const now = new Date().toISOString();
      await db.send(
        new UpdateCommand({
          TableName: TABLES.users,
          Key: { id: existing.id },
          UpdateExpression: 'SET updatedAt = :ua',
          ExpressionAttributeValues: { ':ua': now },
        }),
      );
      return { ...existing, updatedAt: now };
    }

    const now = new Date().toISOString();
    const record: UserRecord = {
      id: uuidv4(),
      email,
      sub,
      role: 'PARENT',
      createdAt: now,
      updatedAt: now,
    };
    await db.send(new PutCommand({ TableName: TABLES.users, Item: record }));
    return record;
  }
}
