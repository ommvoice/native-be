import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import type { OpportunityRecordType } from "../../types/db.js";

export type DrivingLegSnapshot = {
  parentPostCode: string;
  parentLatitude: string;
  parentLongitude: string;
  opportunityPostCode: string | null;
  opportunityLatitude: string;
  opportunityLongitude: string;
};

export type DrivingLegUpsertInput = {
  parentId: string;
  opportunityType: OpportunityRecordType;
  opportunityId: string;
} & DrivingLegSnapshot & {
  drivingDistanceMeters: number;
  drivingDurationSeconds: number;
};

type StoredLeg = DrivingLegSnapshot & {
  parentId: string;
  typeId: string;
  opportunityType: OpportunityRecordType;
  opportunityId: string;
  drivingDistanceMeters: number;
  drivingDurationSeconds: number;
};

function snapshotsMatch(row: DrivingLegSnapshot, current: DrivingLegSnapshot): boolean {
  return (
    row.parentPostCode === current.parentPostCode &&
    row.parentLatitude === current.parentLatitude &&
    row.parentLongitude === current.parentLongitude &&
    row.opportunityPostCode === current.opportunityPostCode &&
    row.opportunityLatitude === current.opportunityLatitude &&
    row.opportunityLongitude === current.opportunityLongitude
  );
}

function fromDb(item: Record<string, unknown>): StoredLeg {
  return {
    parentId: item.parentId as string,
    typeId: item.typeId as string,
    opportunityType: item.opportunityType as OpportunityRecordType,
    opportunityId: item.opportunityId as string,
    parentPostCode: item.parentPostCode as string,
    parentLatitude: item.parentLatitude as string,
    parentLongitude: item.parentLongitude as string,
    opportunityPostCode: (item.opportunityPostCode as string | null) ?? null,
    opportunityLatitude: item.opportunityLatitude as string,
    opportunityLongitude: item.opportunityLongitude as string,
    drivingDistanceMeters: item.drivingDistanceMeters as number,
    drivingDurationSeconds: item.drivingDurationSeconds as number,
  };
}

export class DrivingLegRepository {
  async findByParentId(parentId: string): Promise<StoredLeg[]> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.drivingLegs,
        KeyConditionExpression: "parentId = :pid",
        ExpressionAttributeValues: { ":pid": parentId },
      }),
    );
    return (res.Items ?? []).map((i) => fromDb(i as Record<string, unknown>));
  }

  buildValidMap(
    rows: StoredLeg[],
    currentByKey: Map<string, DrivingLegSnapshot>,
  ): Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }> {
    const out = new Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>();
    for (const row of rows) {
      const key = legKey(row.opportunityType, row.opportunityId);
      const cur = currentByKey.get(key);
      if (!cur) continue;
      const snap: DrivingLegSnapshot = {
        parentPostCode: row.parentPostCode,
        parentLatitude: row.parentLatitude,
        parentLongitude: row.parentLongitude,
        opportunityPostCode: row.opportunityPostCode,
        opportunityLatitude: row.opportunityLatitude,
        opportunityLongitude: row.opportunityLongitude,
      };
      if (snapshotsMatch(snap, cur)) {
        out.set(key, {
          drivingDistanceMeters: row.drivingDistanceMeters,
          drivingDurationSeconds: row.drivingDurationSeconds,
        });
      }
    }
    return out;
  }

  async upsertLeg(input: DrivingLegUpsertInput): Promise<void> {
    const typeId = `${input.opportunityType}#${input.opportunityId}`;
    const now = new Date().toISOString();
    await db.send(
      new PutCommand({
        TableName: TABLES.drivingLegs,
        Item: {
          parentId: input.parentId,
          typeId,
          opportunityType: input.opportunityType,
          opportunityId: input.opportunityId,
          parentPostCode: input.parentPostCode,
          parentLatitude: input.parentLatitude,
          parentLongitude: input.parentLongitude,
          opportunityPostCode: input.opportunityPostCode,
          opportunityLatitude: input.opportunityLatitude,
          opportunityLongitude: input.opportunityLongitude,
          drivingDistanceMeters: input.drivingDistanceMeters,
          drivingDurationSeconds: input.drivingDurationSeconds,
          updatedAt: now,
        },
      }),
    );
  }
}

export function legKey(type: OpportunityRecordType, opportunityId: string): string {
  return `${type}:${opportunityId}`;
}
