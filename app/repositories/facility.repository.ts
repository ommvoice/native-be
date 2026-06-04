import { scanAll, batchGetItems } from '../shared/db/dynamo-helpers';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';

export interface FacilityRecord {
  id: string;
  slug: string;
  label: string;
  type: 'GENERAL' | 'PARENT' | 'KID' | 'DOG';
  createdAt: string;
  updatedAt: string;
}

export class FacilityRepository {
  async list(): Promise<FacilityRecord[]> {
    const items = await scanAll(TABLES.facilities);
    return items as FacilityRecord[];
  }

  async getBySlug(slug: string): Promise<FacilityRecord | null> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.facilities,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': slug },
        Limit: 1,
      }),
    );
    return (res.Items?.[0] as FacilityRecord) ?? null;
  }

  async getByIds(ids: string[]): Promise<FacilityRecord[]> {
    const items = await batchGetItems(TABLES.facilities, ids);
    return items as FacilityRecord[];
  }
}
