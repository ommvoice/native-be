import { vi } from "vitest";
import type { RoutableOpportunityLeg } from "./driving-leg.service.js";
import type { DrivingLegService } from "./driving-leg.service.js";

/** Test double: no DB / Mapbox; driving fields stay null after merge. */
export function createNoopDrivingLegService(): DrivingLegService {
  return {
    async ensureLegsCached(
      _parentId: string,
      _routableLegs: RoutableOpportunityLeg[],
    ) {
      return new Map();
    },
  } as unknown as DrivingLegService;
}

/** Returns a fixed map (simulates `parent_opportunity_driving_legs` already filled). */
export function createDrivingLegServiceReturning(
  map: Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>,
): DrivingLegService {
  return {
    ensureLegsCached: vi.fn().mockResolvedValue(map),
  } as unknown as DrivingLegService;
}

export type DrivingLegCacheCall = { parentId: string; legs: RoutableOpportunityLeg[] };

/**
 * Records each `ensureLegsCached` call (parent id + routable legs) and returns an empty map.
 * Use to assert all four opportunity types were passed for Mapbox/cache hydration.
 */
export function createDrivingLegServiceRecording(): {
  service: DrivingLegService;
  getCalls: () => DrivingLegCacheCall[];
} {
  const calls: DrivingLegCacheCall[] = [];
  const service = {
    ensureLegsCached: vi.fn(async (parentId: string, legs: RoutableOpportunityLeg[]) => {
      calls.push({ parentId, legs: legs.map((l) => ({ ...l, snapshot: { ...l.snapshot } })) });
      return new Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>();
    }),
  } as unknown as DrivingLegService;
  return {
    service,
    getCalls: () => calls,
  };
}
