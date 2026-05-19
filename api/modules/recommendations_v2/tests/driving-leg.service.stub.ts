import { vi } from "vitest";
import type { DrivingLegService, RoutableOpportunityLeg } from "../driving-leg.service.js";

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

/** Returns a fixed map (simulates cached driving legs). */
export function createDrivingLegServiceReturning(
  map: Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>,
): DrivingLegService {
  return {
    ensureLegsCached: vi.fn().mockResolvedValue(map),
  } as unknown as DrivingLegService;
}
