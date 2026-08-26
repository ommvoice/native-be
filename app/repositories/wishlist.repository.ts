import { GetCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { v4 as uuidv4 } from 'uuid';
import { opportunityRefKey, toOpportunityRefColumns, type OpportunityRefType } from '../shared/utils/opportunity-ref';

export interface WishlistRecord {
  id: string;
  name: string;
  color: string;
  parentId: string;
  childId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItemRecord {
  /** `${wishlistId}#${type}#${opportunityId}` — re-adding the same opportunity to the same
   * wishlist overwrites instead of duplicating (matches Lovable's unique-constraint-per-wishlist
   * behavior, enforced here via the key itself rather than a conditional expression). */
  id: string;
  wishlistId: string;
  opportunityVenueId:  string | null;
  opportunityEventId:  string | null;
  opportunityClubId:   string | null;
  opportunityRouteId:  string | null;
  createdAt: string;
  updatedAt: string;
}

export function wishlistItemKey(wishlistId: string, type: OpportunityRefType, opportunityId: string): string {
  return `${wishlistId}#${opportunityRefKey(type, opportunityId)}`;
}

export class WishlistRepository {
  async listByParentId(parentId: string): Promise<WishlistRecord[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.wishlists,
        IndexName: 'parentId-index',
        KeyConditionExpression: 'parentId = :pid',
        ExpressionAttributeValues: { ':pid': parentId },
      }),
    );
    return (res.Items ?? []) as WishlistRecord[];
  }

  async getById(id: string): Promise<WishlistRecord | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.wishlists, Key: { id } }));
    return (res.Item as WishlistRecord) ?? null;
  }

  async create(data: Omit<WishlistRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WishlistRecord> {
    const now = new Date().toISOString();
    const record: WishlistRecord = { id: uuidv4(), createdAt: now, updatedAt: now, ...data };
    await db.send(new PutCommand({ TableName: TABLES.wishlists, Item: record }));
    return record;
  }

  async delete(id: string): Promise<void> {
    await db.send(new DeleteCommand({ TableName: TABLES.wishlists, Key: { id } }));
  }

  async listItems(wishlistId: string): Promise<WishlistItemRecord[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.wishlistItems,
        IndexName: 'wishlistId-index',
        KeyConditionExpression: 'wishlistId = :wid',
        ExpressionAttributeValues: { ':wid': wishlistId },
      }),
    );
    return (res.Items ?? []) as WishlistItemRecord[];
  }

  async addItem(wishlistId: string, type: OpportunityRefType, opportunityId: string): Promise<WishlistItemRecord> {
    const now = new Date().toISOString();
    const record: WishlistItemRecord = {
      id: wishlistItemKey(wishlistId, type, opportunityId),
      wishlistId,
      ...toOpportunityRefColumns(type, opportunityId),
      createdAt: now,
      updatedAt: now,
    };
    await db.send(new PutCommand({ TableName: TABLES.wishlistItems, Item: record }));
    return record;
  }

  async removeItem(id: string): Promise<void> {
    await db.send(new DeleteCommand({ TableName: TABLES.wishlistItems, Key: { id } }));
  }
}
