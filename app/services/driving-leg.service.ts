import { DrivingLegRepository, legKey, type DrivingLegSnapshot } from '../repositories/driving-leg.repository';
import type { OpportunityRecordType } from '../repositories/driving-leg.repository';
import { mapboxDrivingOneToMany, MAPBOX_MATRIX_MAX_DESTINATIONS } from './mapbox-routing.service';
import { normalizeUkPostcode } from './postcode.service';
import { logger } from '../shared/utils/logger';

export interface RoutableLeg {
  type: OpportunityRecordType;
  id: string;
  lat: number;
  lon: number;
  snapshot: DrivingLegSnapshot;
}

function coordKey(n: number): string { return n.toFixed(6); }

export function buildRoutableLeg(
  parent: { postCode: string; latitude: string; longitude: string },
  type: OpportunityRecordType,
  id: string,
  candidatePostcode: string | null,
  routing: { latitude: number; longitude: number },
): RoutableLeg {
  return {
    type, id,
    lat: routing.latitude,
    lon: routing.longitude,
    snapshot: {
      parentPostCode:       (parent.postCode  ?? '').trim(),
      parentLatitude:       (parent.latitude  ?? '').trim(),
      parentLongitude:      (parent.longitude ?? '').trim(),
      opportunityPostCode:  normalizeUkPostcode(candidatePostcode || ""),
      opportunityLatitude:  coordKey(routing.latitude),
      opportunityLongitude: coordKey(routing.longitude),
    },
  };
}

export class DrivingLegService {
  private readonly repo: DrivingLegRepository;

  constructor() {
    this.repo = new DrivingLegRepository();
  }

  async ensureLegsCached(
    parentId: string,
    routableLegs: RoutableLeg[],
  ): Promise<Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>> {
    const currentByKey = new Map<string, DrivingLegSnapshot>();
    for (const leg of routableLegs) {
      currentByKey.set(legKey(leg.type, leg.id), leg.snapshot);
    }

    const existing = await this.repo.findByParentId(parentId);
    const valid     = this.repo.buildValidMap(existing, currentByKey);
    const missing   = routableLegs.filter((leg) => !valid.has(legKey(leg.type, leg.id)));

    if (missing.length === 0) return valid;

    const first = missing[0]!;
    const origin = {
      lat: Number.parseFloat(first.snapshot.parentLatitude),
      lon: Number.parseFloat(first.snapshot.parentLongitude),
    };
    if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lon)) return valid;

    for (let i = 0; i < missing.length; i += MAPBOX_MATRIX_MAX_DESTINATIONS) {
      const chunk  = missing.slice(i, i + MAPBOX_MATRIX_MAX_DESTINATIONS);
      const dests  = chunk.map((c) => ({ lat: c.lat, lon: c.lon }));

      try {
        const results = await mapboxDrivingOneToMany(origin, dests);

        for (let j = 0; j < chunk.length; j++) {
          const leg = chunk[j]!;
          const r   = results[j];
          if (r?.distanceMeters != null && r.durationSeconds != null &&
              Number.isFinite(r.distanceMeters) && Number.isFinite(r.durationSeconds)) {
            await this.repo.upsertLeg({
              parentId,
              opportunityType:       leg.type,
              opportunityId:         leg.id,
              ...leg.snapshot,
              drivingDistanceMeters:  Math.round(r.distanceMeters),
              drivingDurationSeconds: Math.round(r.durationSeconds),
            });
            valid.set(legKey(leg.type, leg.id), {
              drivingDistanceMeters:  Math.round(r.distanceMeters),
              drivingDurationSeconds: Math.round(r.durationSeconds),
            });
          }
        }
      } catch (err) {
        logger.warn('Driving leg batch failed — keeping partial cache', err);
      }
    }

    return valid;
  }
}
