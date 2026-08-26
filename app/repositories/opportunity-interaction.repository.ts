import { GetCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { opportunityRefKey, type OpportunityRefType } from '../shared/utils/opportunity-ref';

export type InteractionType = 'visited' | 'not_interested';

/** A parent's "Already Been?" status on a saved opportunity — visited (with an optional star
 * rating) or not interested. Mirrors nativeapp-main-loveable's opportunity_interactions table. */
export interface OpportunityInteractionRecord {
  /** `${parentId}#${type}#${opportunityId}` — one active interaction per opportunity per parent. */
  id: string;
  parentId: string;
  opportunityType: OpportunityRefType;
  opportunityId: string;
  interactionType: InteractionType;
  starRating: number | null;
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function opportunityInteractionKey(parentId: string, type: OpportunityRefType, opportunityId: string): string {
  return `${parentId}#${opportunityRefKey(type, opportunityId)}`;
}

export class OpportunityInteractionRepository {
  async getById(id: string): Promise<OpportunityInteractionRecord | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityInteractions, Key: { id } }));
    return (res.Item as OpportunityInteractionRecord) ?? null;
  }

  async listByParentId(parentId: string): Promise<OpportunityInteractionRecord[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.opportunityInteractions,
        IndexName: 'parentId-index',
        KeyConditionExpression: 'parentId = :pid',
        ExpressionAttributeValues: { ':pid': parentId },
      }),
    );
    return (res.Items ?? []) as OpportunityInteractionRecord[];
  }

  /** Upsert — same deterministic-key-overwrite pattern as VisitIntentionRepository.upsert; also
   * used to update just the star rating (caller re-sends the full record with a new starRating). */
  async upsert(data: Omit<OpportunityInteractionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<OpportunityInteractionRecord> {
    const id = opportunityInteractionKey(data.parentId, data.opportunityType, data.opportunityId);
    const now = new Date().toISOString();
    const record: OpportunityInteractionRecord = { ...data, id, createdAt: now, updatedAt: now };
    await db.send(new PutCommand({ TableName: TABLES.opportunityInteractions, Item: record }));
    return record;
  }

  async delete(id: string): Promise<void> {
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityInteractions, Key: { id } }));
  }
}
