import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';

export type OpportunityRecordType = 'venue' | 'event' | 'club' | 'route';

export interface DrivingLegRecord {
  typeId: string;           // composite PK: "{type}#{id}"
  parentId: string;
  opportunityType: OpportunityRecordType;
  opportunityId: string;
  parentPostCode: string;
  parentLatitude: string;
  parentLongitude: string;
  opportunityPostCode: string | null;
  opportunityLatitude: string;
  opportunityLongitude: string;
  drivingDistanceMeters: number;
  drivingDurationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface DrivingLegSnapshot {
  parentPostCode: string;
  parentLatitude: string;
  parentLongitude: string;
  opportunityPostCode: string | null;
  opportunityLatitude: string;
  opportunityLongitude: string;
}

export function legKey(type: OpportunityRecordType, id: string): string {
  return `${type}#${id}`;
}

export class DrivingLegRepository {
  async findByParentId(parentId: string): Promise<DrivingLegRecord[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.drivingLegs,
        IndexName: 'parentId-index',
        KeyConditionExpression: 'parentId = :pid',
        ExpressionAttributeValues: { ':pid': parentId },
      }),
    );
    return (res.Items ?? []) as DrivingLegRecord[];
  }

  async upsertLeg(data: Omit<DrivingLegRecord, 'typeId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now    = new Date().toISOString();
    const typeId = legKey(data.opportunityType, data.opportunityId);
    await db.send(
      new PutCommand({
        TableName: TABLES.drivingLegs,
        Item: { ...data, typeId, createdAt: now, updatedAt: now },
      }),
    );
  }

  buildValidMap(
    existing: DrivingLegRecord[],
    currentSnapshots: Map<string, DrivingLegSnapshot>,
  ): Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }> {
    const valid = new Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>();
    for (const leg of existing) {
      const snap = currentSnapshots.get(leg.typeId);
      if (!snap) continue;
      if (
        leg.parentLatitude        === snap.parentLatitude &&
        leg.parentLongitude       === snap.parentLongitude &&
        leg.opportunityLatitude   === snap.opportunityLatitude &&
        leg.opportunityLongitude  === snap.opportunityLongitude
      ) {
        valid.set(leg.typeId, {
          drivingDistanceMeters:  leg.drivingDistanceMeters,
          drivingDurationSeconds: leg.drivingDurationSeconds,
        });
      }
    }
    return valid;
  }
}
