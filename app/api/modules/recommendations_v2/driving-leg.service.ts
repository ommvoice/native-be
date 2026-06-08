import type { OpportunityRecordType } from "../../types/db.js";
import { normalizeUkPostcode } from "./postcode-coords.js";
import {
  DrivingLegRepository,
  type DrivingLegSnapshot,
} from "./driving-leg.repository.js";
import { legKey } from "./driving-leg-keys.js";
import { mapboxDrivingOneToMany, MAPBOX_MATRIX_MAX_DESTINATIONS } from "./mapbox-routing.js";

export type RoutableOpportunityLeg = {
  type: OpportunityRecordType;
  id: string;
  lon: number;
  lat: number;
  snapshot: DrivingLegSnapshot;
};

function snapshotPostcode(raw: string | null | undefined): string | null {
  return normalizeUkPostcode(raw ?? undefined);
}

function coordKey(n: number): string {
  return n.toFixed(6);
}

/**
 * Build snapshot + routing point from parent row and resolved WGS84 for the opportunity.
 */
export function buildRoutableLeg(
  parent: { postCode: string; latitude: string; longitude: string },
  type: OpportunityRecordType,
  id: string,
  candidatePostcode: string | null,
  routing: { latitude: number; longitude: number },
): RoutableOpportunityLeg {
  const snapshot: DrivingLegSnapshot = {
    parentPostCode: (parent.postCode ?? "").trim(),
    parentLatitude: (parent.latitude ?? "").trim(),
    parentLongitude: (parent.longitude ?? "").trim(),
    opportunityPostCode: snapshotPostcode(candidatePostcode),
    opportunityLatitude: coordKey(routing.latitude),
    opportunityLongitude: coordKey(routing.longitude),
  };
  return {
    type,
    id,
    lon: routing.longitude,
    lat: routing.latitude,
    snapshot,
  };
}

export class DrivingLegService {
  constructor(private readonly repo = new DrivingLegRepository()) {}

  private getToken(): string | undefined {
    const t = process.env.MAPBOX_ACCESS_TOKEN?.trim();
    return t || undefined;
  }

  /**
   * Loads cached legs that still match snapshots, calls Mapbox for missing/stale pairs (when token set), returns map for merging into API responses.
   *
   * **Why chunk / loop:** [Mapbox Matrix](https://docs.mapbox.com/api/navigation/matrix/) for `mapbox/driving`
   * accepts **at most 25 coordinates per request**. We send the parent at index `0` and up to 24
   * destinations per call. So if there are e.g. 10 missing legs, the loop runs **once** (single API
   * call). Multiple iterations only happen when a parent has more than 24 new/stale legs at once.
   */
  async ensureLegsCached(
    parentId: string,
    routableLegs: RoutableOpportunityLeg[],
  ): Promise<Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>> {
    const currentByKey = new Map<string, DrivingLegSnapshot>();
    for (const leg of routableLegs) {
      currentByKey.set(legKey(leg.type, leg.id), leg.snapshot);
    }

    const existing = await this.repo.findByParentId(parentId);
    const valid = this.repo.buildValidMap(existing, currentByKey);

    const token = this.getToken();
    const missing = routableLegs.filter((leg) => !valid.has(legKey(leg.type, leg.id)));

    if (missing.length === 0 || !token) {
      return valid;
    }

    const origin = {
      lon: Number.parseFloat(missing[0]!.snapshot.parentLongitude),
      lat: Number.parseFloat(missing[0]!.snapshot.parentLatitude),
    };
    if (!Number.isFinite(origin.lon) || !Number.isFinite(origin.lat)) {
      return valid;
    }

    for (let i = 0; i < missing.length; i += MAPBOX_MATRIX_MAX_DESTINATIONS) {
      const chunk = missing.slice(i, i + MAPBOX_MATRIX_MAX_DESTINATIONS);
      const dests = chunk.map((c) => ({ lon: c.lon, lat: c.lat }));
      try {
        const results = await mapboxDrivingOneToMany(token, origin, dests);
        for (let j = 0; j < chunk.length; j++) {
          const leg = chunk[j]!;
          const r = results[j];
          if (
            r?.distanceMeters != null &&
            r.durationSeconds != null &&
            Number.isFinite(r.distanceMeters) &&
            Number.isFinite(r.durationSeconds)
          ) {
            await this.repo.upsertLeg({
              parentId,
              opportunityType: leg.type,
              opportunityId: leg.id,
              ...leg.snapshot,
              drivingDistanceMeters: Math.round(r.distanceMeters),
              drivingDurationSeconds: Math.round(r.durationSeconds),
            });
            valid.set(legKey(leg.type, leg.id), {
              drivingDistanceMeters: Math.round(r.distanceMeters),
              drivingDurationSeconds: Math.round(r.durationSeconds),
            });
          }
        }
      } catch {
        // Network / Mapbox failure: keep partial cache only
      }
    }

    return valid;
  }
}

export function metersToMilesOneDecimal(meters: number): number {
  return Math.round(meters * 0.000621371192 * 10) / 10;
}
