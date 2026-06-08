import { describe, it, expect } from "vitest";
import {
  DrivingLegRepository,
  legKey,
  type DrivingLegSnapshot,
} from "./driving-leg.repository.js";

type DrivingLegRow = {
  id: string;
  parentId: string;
  opportunityType: "venue";
  opportunityId: string;
  parentPostCode: string;
  parentLatitude: string;
  parentLongitude: string;
  opportunityPostCode: string | null;
  opportunityLatitude: string;
  opportunityLongitude: string;
  drivingDistanceMeters: number;
  drivingDurationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
};

function row(overrides: Partial<DrivingLegRow> & Pick<DrivingLegRow, "opportunityId">): DrivingLegRow {
  return {
    id: "row-id",
    parentId: "parent-1",
    opportunityType: "venue",
    parentPostCode: "HP2 7DB",
    parentLatitude: "51.773282",
    parentLongitude: "-0.434612",
    opportunityPostCode: "HP1 1BB",
    opportunityLatitude: "51.751393",
    opportunityLongitude: "-0.471936",
    drivingDistanceMeters: overrides.drivingDistanceMeters ?? 10_000,
    drivingDurationSeconds: overrides.drivingDurationSeconds ?? 600,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function snapshotForRow(r: DrivingLegRow): DrivingLegSnapshot {
  return {
    parentPostCode: r.parentPostCode,
    parentLatitude: r.parentLatitude,
    parentLongitude: r.parentLongitude,
    opportunityPostCode: r.opportunityPostCode,
    opportunityLatitude: r.opportunityLatitude,
    opportunityLongitude: r.opportunityLongitude,
  };
}

describe("DrivingLegRepository.buildValidMap (drivingDistanceMeters / drivingDurationSeconds)", () => {
  const repo = new DrivingLegRepository();

  it("copies drivingDistanceMeters and drivingDurationSeconds when snapshot matches", () => {
    const r = row({ opportunityId: "opp-1", drivingDistanceMeters: 15234, drivingDurationSeconds: 942 });
    const current = new Map<string, DrivingLegSnapshot>([
      [legKey("venue", "opp-1"), snapshotForRow(r)],
    ]);

    const map = repo.buildValidMap([r] as never, current);

    expect(map.get(legKey("venue", "opp-1"))).toEqual({
      drivingDistanceMeters: 15234,
      drivingDurationSeconds: 942,
    });
  });

  it("preserves duration 0 and small meter values", () => {
    const r = row({ opportunityId: "opp-zero", drivingDistanceMeters: 1, drivingDurationSeconds: 0 });
    const current = new Map([[legKey("venue", "opp-zero"), snapshotForRow(r)]]);

    const map = repo.buildValidMap([r] as never, current);

    expect(map.get(legKey("venue", "opp-zero"))).toEqual({
      drivingDistanceMeters: 1,
      drivingDurationSeconds: 0,
    });
  });

  it("excludes row when parent postcode in DB differs from current snapshot", () => {
    const r = row({ opportunityId: "opp-stale", parentPostCode: "OLD 1AA" });
    const current = new Map([[legKey("venue", "opp-stale"), snapshotForRow({ ...r, parentPostCode: "HP2 7DB" })]]);

    const map = repo.buildValidMap([r] as never, current);

    expect(map.has(legKey("venue", "opp-stale"))).toBe(false);
  });

  it("excludes row when opportunity is not in currentByKey", () => {
    const r = row({ opportunityId: "orphan" });
    const map = repo.buildValidMap([r] as never, new Map());

    expect(map.size).toBe(0);
  });
});
