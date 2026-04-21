import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDrivingLegServiceReturning } from "./driving-leg.service.stub.js";
import { metersToMilesOneDecimal } from "./driving-leg.service.js";
import { legKey } from "./driving-leg.repository.js";
import {
  createRecommendationsRepositoryStub,
  stubParentNatureChildAge7,
  STUB_TIME_ANCHOR_ISO,
} from "./recommendations.repository.stubs.js";
import { RecommendationsService } from "./service.js";
import type { RecommendationCandidate } from "./types.js";

/** Single venue for deterministic ranking and merge assertions. */
const SINGLE_VENUE: RecommendationCandidate[] = [
  {
    type: "venue",
    id: "metrics-venue-1",
    name: "Metrics venue",
    description: null,
    postcode: "HP1 1BB",
    latitude: "51.751393",
    longitude: "-0.471936",
    interestTags: "nature_exploration",
    themeSlug: "animal_encounters",
    ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8", "age_9"],
    skillAreaSlug: null,
    skillAreaVariant: null,
  },
];

describe("Driving metrics on API responses (from drivingDistanceMeters + drivingDurationSeconds)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STUB_TIME_ANCHOR_ISO));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const parent = stubParentNatureChildAge7({ id: "parent-metrics" });

  it.each([
    {
      name: "typical urban leg",
      drivingDistanceMeters: 8420,
      drivingDurationSeconds: 720,
    },
    {
      name: "zero duration (instant / unroutable edge from provider)",
      drivingDistanceMeters: 100,
      drivingDurationSeconds: 0,
    },
    {
      name: "long motorway",
      drivingDistanceMeters: 185_000,
      drivingDurationSeconds: 21_600,
    },
  ])(
    "getRecommendationsForParent: $name — drivingDurationSeconds equals Mapbox seconds; miles from meters",
    async ({ drivingDistanceMeters, drivingDurationSeconds }) => {
      const map = new Map([
        [
          legKey("venue", "metrics-venue-1"),
          { drivingDistanceMeters, drivingDurationSeconds },
        ],
      ]);
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: SINGLE_VENUE,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(map));

      const [row] = await service.getRecommendationsForParent({
        parentId: parent.id,
      });

      expect(row).toBeDefined();
      expect(row!.drivingDurationSeconds).toBe(drivingDurationSeconds);
      expect(row!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(drivingDistanceMeters));
    },
  );

  it.each([
    { drivingDistanceMeters: 3218, drivingDurationSeconds: 333 },
    { drivingDistanceMeters: 50_000, drivingDurationSeconds: 3600 },
  ])(
    "getRecommendationsForParentNearby: passes drivingDurationSeconds through; converts drivingDistanceMeters to drivingDistanceMiles",
    async ({ drivingDistanceMeters, drivingDurationSeconds }) => {
      const map = new Map([
        [legKey("venue", "metrics-venue-1"), { drivingDistanceMeters, drivingDurationSeconds }],
      ]);
      const repo = createRecommendationsRepositoryStub({
        parent,
        candidates: SINGLE_VENUE,
      });
      const service = new RecommendationsService(repo, createDrivingLegServiceReturning(map));

      const [row] = await service.getRecommendationsForParentNearby({
        parentId: parent.id,
      });

      expect(row!.drivingDurationSeconds).toBe(drivingDurationSeconds);
      expect(row!.drivingDistanceMiles).toBe(metersToMilesOneDecimal(drivingDistanceMeters));
    },
  );
});
