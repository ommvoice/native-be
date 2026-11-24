import { BatchWriteCommand, DeleteCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';

/**
 * Cached driving legs, keyed by WHERE the route starts (originKey) + the opportunity (typeId), not by
 * parent. Every parent whose home rounds to the same point shares the rows, and Nearby (origin = the
 * opportunity being viewed) shares them across every user. The old DrivingLegs table was keyed by
 * typeId alone, so each parent's write replaced every other parent's leg and the next request from
 * anyone re-billed the whole list.
 */
export interface RouteLegRecord {
  originKey: string;            // PK: "50.6123,-3.4123" (see originKeyOf)
  typeId: string;               // SK: "{type}#{id}", or LOCK_TYPE_ID for the routing lock
  opportunityLatitude?: string; // snapshot — a moved opportunity is re-routed
  opportunityLongitude?: string;
  routeFound?: boolean;         // false: Google has no driving route — cached so it isn't re-billed
  drivingDistanceMeters?: number | null;
  drivingDurationSeconds?: number | null;
  lockUntil?: number;           // lock row only: epoch ms
  updatedAt: string;
  expiresAt: number;            // DynamoDB TTL, epoch seconds
}

/** Sort key of the per-origin lock row (sorts after every "{type}#{id}"). */
export const LOCK_TYPE_ID = '~lock';

/** Origins are rounded to 4 decimal places (~11 m): homes from the same postcode share one cache. */
export function originKeyOf(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

const BATCH_WRITE_MAX = 25;

export class RouteLegRepository {
  /** Every row for an origin (legs + the lock row, if any). */
  async findByOrigin(originKey: string): Promise<RouteLegRecord[]> {
    const items: RouteLegRecord[] = [];
    let lastKey: Record<string, unknown> | undefined;
    do {
      const res = await db.send(new QueryCommand({
        TableName: TABLES.routeLegs,
        KeyConditionExpression: 'originKey = :o',
        ExpressionAttributeValues: { ':o': originKey },
        ExclusiveStartKey: lastKey,
      }));
      items.push(...((res.Items ?? []) as RouteLegRecord[]));
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return items;
  }

  async putLegs(records: RouteLegRecord[]): Promise<void> {
    for (let i = 0; i < records.length; i += BATCH_WRITE_MAX) {
      let requests: Record<string, unknown>[] = records
        .slice(i, i + BATCH_WRITE_MAX)
        .map((Item) => ({ PutRequest: { Item } }));
      // Retry throttled leftovers a few times — a lost cache row only costs a re-route later.
      for (let attempt = 0; attempt < 3 && requests.length; attempt++) {
        const res = await db.send(new BatchWriteCommand({ RequestItems: { [TABLES.routeLegs]: requests as never } }));
        requests = (res.UnprocessedItems?.[TABLES.routeLegs] ?? []) as Record<string, unknown>[];
      }
    }
  }

  /** Claims the origin's routing lock until `lockUntil` (epoch ms). False when someone else holds it. */
  async tryLock(originKey: string, lockUntil: number): Promise<boolean> {
    try {
      await db.send(new PutCommand({
        TableName: TABLES.routeLegs,
        Item: {
          originKey,
          typeId: LOCK_TYPE_ID,
          lockUntil,
          updatedAt: new Date().toISOString(),
          expiresAt: Math.ceil(lockUntil / 1000) + 3600,
        },
        ConditionExpression: 'attribute_not_exists(originKey) OR lockUntil < :now',
        ExpressionAttributeValues: { ':now': Date.now() },
      }));
      return true;
    } catch (err) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') return false;
      throw err;
    }
  }

  async releaseLock(originKey: string): Promise<void> {
    await db.send(new DeleteCommand({ TableName: TABLES.routeLegs, Key: { originKey, typeId: LOCK_TYPE_ID } }));
  }

  /** Removes every cached leg from an origin (account deletion: legs from the parent's home). */
  async deleteOrigin(originKey: string): Promise<void> {
    const rows = await this.findByOrigin(originKey);
    for (let i = 0; i < rows.length; i += BATCH_WRITE_MAX) {
      const requests = rows.slice(i, i + BATCH_WRITE_MAX)
        .map((r) => ({ DeleteRequest: { Key: { originKey: r.originKey, typeId: r.typeId } } }));
      await db.send(new BatchWriteCommand({ RequestItems: { [TABLES.routeLegs]: requests } }));
    }
  }
}
