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
  /** not_interested only: ISO time until which the opportunity is hidden from every
   * recommendation/plan/search list ("Not for us" on the detail screen). Unset on records written
   * before this field existed — see suppressedUntil() below. */
  suppressedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** How long "Not for us" hides an opportunity for the family. */
export const NOT_INTERESTED_SUPPRESSION_DAYS = 90;

export function suppressionEndFrom(fromIso: string): string {
  const end = new Date(fromIso);
  end.setUTCDate(end.getUTCDate() + NOT_INTERESTED_SUPPRESSION_DAYS);
  return end.toISOString();
}

/** When a not_interested interaction stops hiding its opportunity — null for any other type.
 * Older records without suppressedUntil fall back to updatedAt + 90 days. */
export function suppressedUntil(i: OpportunityInteractionRecord): string | null {
  if (i.interactionType !== 'not_interested') return null;
  return i.suppressedUntil ?? suppressionEndFrom(i.updatedAt);
}

export function isSuppressed(i: OpportunityInteractionRecord, now: Date = new Date()): boolean {
  const until = suppressedUntil(i);
  return !!until && until > now.toISOString();
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
