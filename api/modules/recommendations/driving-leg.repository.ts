import type { OpportunityRecordType } from "@prisma/client";
import prisma from "../../database/database.config.js";

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

export class DrivingLegRepository {
  async findByParentId(parentId: string) {
    return prisma.parentOpportunityDrivingLeg.findMany({
      where: { parentId },
    });
  }

  /**
   * Rows whose snapshot still matches `currentByKey` (composite `type:id` → snapshot).
   */
  buildValidMap(
    rows: Awaited<ReturnType<DrivingLegRepository["findByParentId"]>>,
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

  async upsertLeg(input: DrivingLegUpsertInput) {
    return prisma.parentOpportunityDrivingLeg.upsert({
      where: {
        parentId_opportunityType_opportunityId: {
          parentId: input.parentId,
          opportunityType: input.opportunityType,
          opportunityId: input.opportunityId,
        },
      },
      create: {
        parentId: input.parentId,
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
      },
      update: {
        parentPostCode: input.parentPostCode,
        parentLatitude: input.parentLatitude,
        parentLongitude: input.parentLongitude,
        opportunityPostCode: input.opportunityPostCode,
        opportunityLatitude: input.opportunityLatitude,
        opportunityLongitude: input.opportunityLongitude,
        drivingDistanceMeters: input.drivingDistanceMeters,
        drivingDurationSeconds: input.drivingDurationSeconds,
      },
    });
  }
}

export function legKey(type: OpportunityRecordType, opportunityId: string): string {
  return `${type}:${opportunityId}`;
}
