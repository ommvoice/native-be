import { legKey, type DrivingLegSnapshot } from '../repositories/driving-leg.repository';
import type { OpportunityRecordType } from '../repositories/driving-leg.repository';
import { LOCK_TYPE_ID, originKeyOf, RouteLegRepository, type RouteLegRecord } from '../repositories/route-leg.repository';
import { MAPBOX_MATRIX_MAX_DESTINATIONS, googleDrivingOneToMany } from './mapbox-routing.service';
import { normalizeUkPostcode } from './postcode.service';
import { logger } from '../shared/utils/logger';

export interface RoutableLeg {
  type: OpportunityRecordType;
  id: string;
  lat: number;
  lon: number;
  snapshot: DrivingLegSnapshot;
}

export type DrivingLegMap = Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>;

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

const DAY_SECONDS = 24 * 60 * 60;
/** Found routes are refreshed after 90 days (roads change rarely); "no route" is retried after 7. */
const ROUTE_TTL_SECONDS = 90 * DAY_SECONDS;
const NO_ROUTE_TTL_SECONDS = 7 * DAY_SECONDS;
/** How long one request may hold an origin's routing lock. */
const LOCK_MS = 25_000;
/** A request that finds the lock taken waits this long (polling) for the holder's results. */
const LOCK_WAIT_MS = 8_000;
const LOCK_POLL_MS = 800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class DrivingLegService {
  private readonly repo = new RouteLegRepository();

  /**
   * Driving distance/time from `origin` (a parent's home, or the opportunity being viewed for
   * Nearby) to each leg. Google's Route Matrix bills per element, so:
   *   - every leg is cached per origin (RouteLegs table) and only routed once — shared by every
   *     parent at that origin and every user viewing that opportunity;
   *   - "no driving route" answers are cached too, so they aren't re-billed on every request;
   *   - one request at a time routes an origin (a lock row): parallel requests (e.g. Today's family
   *     + child lists on app open) wait for its results instead of routing the same legs again.
   * Legs that still have no driving data are left out of the map — callers fall back to the
   * straight-line distance.
   */
  async legsFrom(origin: { lat: number; lon: number }, legs: RoutableLeg[]): Promise<DrivingLegMap> {
    const result: DrivingLegMap = new Map();
    if (legs.length === 0 || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lon)) return result;

    const originKey = originKeyOf(origin.lat, origin.lon);
    const wanted = new Map(legs.map((leg) => [legKey(leg.type, leg.id), leg]));

    let { missing, locked } = await this.readCached(originKey, wanted, result);
    const cachedCount = legs.length - missing.length;
    if (missing.length === 0) return result;

    const lockUntil = () => Date.now() + LOCK_MS;
    let haveLock = !locked && await this.repo.tryLock(originKey, lockUntil());
    if (!haveLock) {
      // Someone else is routing from this origin — use what they save instead of paying twice.
      for (let waited = 0; waited < LOCK_WAIT_MS && missing.length > 0; waited += LOCK_POLL_MS) {
        await sleep(LOCK_POLL_MS);
        ({ missing, locked } = await this.readCached(originKey, wanted, result));
        if (!locked) break;
      }
      if (missing.length === 0) return result;
      haveLock = await this.repo.tryLock(originKey, lockUntil());
      if (!haveLock) return result; // still busy — straight-line distance for this response only
      ({ missing } = await this.readCached(originKey, wanted, result));
      if (missing.length === 0) {
        await this.repo.releaseLock(originKey);
        return result;
      }
    }

    try {
      await this.route(origin, originKey, missing, result);
      logger.info('Route matrix elements billed', {
        elements: missing.length,
        cached: cachedCount,
        requested: legs.length,
      });
    } finally {
      await this.repo.releaseLock(originKey).catch((err) => logger.warn('Route leg lock release failed', err));
    }
    return result;
  }

  /** @deprecated Use legsFrom — kept for old callers; routes from the parent's home via the shared cache. */
  async ensureLegsCached(_parentId: string, legs: RoutableLeg[]): Promise<DrivingLegMap> {
    const first = legs[0];
    if (!first) return new Map();
    return this.legsFrom({
      lat: Number.parseFloat(first.snapshot.parentLatitude),
      lon: Number.parseFloat(first.snapshot.parentLongitude),
    }, legs);
  }

  /** @deprecated Use legsFrom (now cached per origin). */
  async computeLegsFrom(origin: { lat: number; lon: number }, legs: RoutableLeg[]): Promise<DrivingLegMap> {
    return this.legsFrom(origin, legs);
  }

  /** Fills `result` from the cache; returns the legs still to route and whether the origin is locked. */
  private async readCached(
    originKey: string,
    wanted: Map<string, RoutableLeg>,
    result: DrivingLegMap,
  ): Promise<{ missing: RoutableLeg[]; locked: boolean }> {
    const rows = await this.repo.findByOrigin(originKey);
    const now = Date.now();
    let locked = false;
    const done = new Set<string>();
    for (const row of rows) {
      if (row.typeId === LOCK_TYPE_ID) {
        locked = (row.lockUntil ?? 0) > now;
        continue;
      }
      const leg = wanted.get(row.typeId);
      if (!leg) continue;
      // The opportunity moved since this was routed → route it again.
      if (row.opportunityLatitude !== leg.snapshot.opportunityLatitude ||
          row.opportunityLongitude !== leg.snapshot.opportunityLongitude) continue;
      done.add(row.typeId);
      if (row.routeFound && row.drivingDistanceMeters != null && row.drivingDurationSeconds != null) {
        result.set(row.typeId, {
          drivingDistanceMeters:  row.drivingDistanceMeters,
          drivingDurationSeconds: row.drivingDurationSeconds,
        });
      }
    }
    const missing = [...wanted.entries()].filter(([key]) => !done.has(key)).map(([, leg]) => leg);
    return { missing, locked };
  }

  /** Routes `legs` from `origin` in Google-sized chunks, caching every answered leg. */
  private async route(
    origin: { lat: number; lon: number },
    originKey: string,
    legs: RoutableLeg[],
    result: DrivingLegMap,
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    const nowSec = Math.floor(Date.now() / 1000);

    for (let i = 0; i < legs.length; i += MAPBOX_MATRIX_MAX_DESTINATIONS) {
      const chunk = legs.slice(i, i + MAPBOX_MATRIX_MAX_DESTINATIONS);
      const records: RouteLegRecord[] = [];
      try {
        const results = await googleDrivingOneToMany(origin, chunk.map((c) => ({ lat: c.lat, lon: c.lon })));
        chunk.forEach((leg, j) => {
          const r = results[j];
          const base = {
            originKey,
            typeId:               legKey(leg.type, leg.id),
            opportunityLatitude:  leg.snapshot.opportunityLatitude,
            opportunityLongitude: leg.snapshot.opportunityLongitude,
            updatedAt:            nowIso,
          };
          if (r?.distanceMeters != null && r.durationSeconds != null &&
              Number.isFinite(r.distanceMeters) && Number.isFinite(r.durationSeconds)) {
            const driving = {
              drivingDistanceMeters:  Math.round(r.distanceMeters),
              drivingDurationSeconds: Math.round(r.durationSeconds),
            };
            result.set(base.typeId, driving);
            records.push({ ...base, ...driving, routeFound: true, expiresAt: nowSec + ROUTE_TTL_SECONDS });
          } else if (r?.routeNotFound) {
            records.push({ ...base, routeFound: false, expiresAt: nowSec + NO_ROUTE_TTL_SECONDS });
          }
          // Anything else (call failed) isn't cached — it's retried on the next request.
        });
      } catch (err) {
        logger.warn('Driving leg batch failed — keeping partial cache', err);
      }
      if (records.length) await this.repo.putLegs(records);
    }
  }
}
