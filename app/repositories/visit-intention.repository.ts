import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { opportunityRefKey, type OpportunityRefType } from '../shared/utils/opportunity-ref';

/** A parent's intention to visit a saved opportunity ("Remind Me" — tomorrow/this weekend/next
 * month, or an effort-based reminder stored as "effort_<slug>", matching nativeapp-main-loveable's
 * visit_intentions table convention of overloading one free-text timeframe column). */
export interface VisitIntentionRecord {
  /** `${parentId}#${type}#${opportunityId}` — one active intention per opportunity per parent;
   * re-setting an intention overwrites the previous one instead of duplicating. */
  id: string;
  parentId: string;
  opportunityType: OpportunityRefType;
  opportunityId: string;
  timeframe: string;
  createdAt: string;
  updatedAt: string;
}

export function visitIntentionKey(parentId: string, type: OpportunityRefType, opportunityId: string): string {
  return `${parentId}#${opportunityRefKey(type, opportunityId)}`;
}

export class VisitIntentionRepository {
  async listByParentId(parentId: string): Promise<VisitIntentionRecord[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.visitIntentions,
        IndexName: 'parentId-index',
        KeyConditionExpression: 'parentId = :pid',
        ExpressionAttributeValues: { ':pid': parentId },
      }),
    );
    return (res.Items ?? []) as VisitIntentionRecord[];
  }

  /** Upsert — Put on the deterministic key naturally overwrites any existing intention for the
   * same parent+opportunity, mirroring Lovable's delete-then-insert "one active intention" rule
   * without the race window a separate delete step would have. */
  async upsert(data: Omit<VisitIntentionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<VisitIntentionRecord> {
    const id = visitIntentionKey(data.parentId, data.opportunityType, data.opportunityId);
    const now = new Date().toISOString();
    const record: VisitIntentionRecord = { ...data, id, createdAt: now, updatedAt: now };
    await db.send(new PutCommand({ TableName: TABLES.visitIntentions, Item: record }));
    return record;
  }

  async delete(id: string): Promise<void> {
    await db.send(new DeleteCommand({ TableName: TABLES.visitIntentions, Key: { id } }));
  }
}
