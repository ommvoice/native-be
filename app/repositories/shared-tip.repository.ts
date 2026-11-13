import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import type { OpportunityRefType } from '../shared/utils/opportunity-ref';
import type { SharedTipKind, SharedTipRatingsDto } from '../dtos/shared-tip.dto';

/** A parent's "Share A Tip" submission. Starts as `pending` for the Native team to review. */
export interface SharedTipRecord {
  id: string;
  parentId: string;
  userId: string;
  kind: SharedTipKind;
  placeName: string;
  tip: string;
  bring: string | null;
  /** S3 object key in the private uploads bucket, and its canonical (non-public) URL. */
  photoKey: string | null;
  photoUrl: string | null;
  opportunityId: string | null;
  opportunityType: OpportunityRefType | null;
  worksFor: string[];
  ratings: SharedTipRatingsDto;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export class SharedTipRepository {
  async create(data: Omit<SharedTipRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SharedTipRecord> {
    const now = new Date().toISOString();
    const record: SharedTipRecord = { ...data, id: uuidv4(), status: 'pending', createdAt: now, updatedAt: now };
    await db.send(new PutCommand({ TableName: TABLES.sharedTips, Item: record }));
    return record;
  }

  async listByParentId(parentId: string): Promise<SharedTipRecord[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.sharedTips,
        IndexName: 'parentId-index',
        KeyConditionExpression: 'parentId = :pid',
        ExpressionAttributeValues: { ':pid': parentId },
      }),
    );
    return (res.Items ?? []) as SharedTipRecord[];
  }
}
