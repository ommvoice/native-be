import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import type { ROLE, Users } from "../../types/db.js";

function fromDb(item: Record<string, unknown>): Users {
  return {
    id: item.id as string,
    email: item.email as string,
    sub: item.sub as string,
    role: item.role as ROLE,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class UserRepository {
  async getById(id: string): Promise<Users | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.users, Key: { id } }));
    return res.Item ? fromDb(res.Item) : null;
  }

  async getByEmail(email: string): Promise<Users | null> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.users,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
        Limit: 1,
      }),
    );
    const item = res.Items?.[0];
    return item ? fromDb(item) : null;
  }

  async create(email: string, role: ROLE, sub: string): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.send(
      new PutCommand({
        TableName: TABLES.users,
        Item: { id, email, sub, role, createdAt: now, updatedAt: now },
      }),
    );
    return id;
  }

  async upsertBySub(
    sub: string,
    email: string,
  ): Promise<{ id: string; email: string; role: ROLE; sub: string }> {
    const existing = await this.getBySub(sub);
    if (existing) {
      if (existing.email !== email) {
        const now = new Date().toISOString();
        await db.send(
          new UpdateCommand({
            TableName: TABLES.users,
            Key: { id: existing.id },
            UpdateExpression: "SET email = :email, updatedAt = :ua",
            ExpressionAttributeValues: { ":email": email, ":ua": now },
          }),
        );
      }
      return { id: existing.id, email, role: existing.role, sub: existing.sub };
    }
    const id = await this.create(email, "PARENT", sub);
    return { id, email, role: "PARENT", sub };
  }

  async getBySub(sub: string): Promise<Users | null> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.users,
        IndexName: "sub-index",
        KeyConditionExpression: "#sub = :sub",
        ExpressionAttributeNames: { "#sub": "sub" },
        ExpressionAttributeValues: { ":sub": sub },
        Limit: 1,
      }),
    );
    const item = res.Items?.[0];
    return item ? fromDb(item) : null;
  }
}
