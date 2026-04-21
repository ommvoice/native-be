import { describe, expect, it, vi } from "vitest";
import type { OpportunityRecordType } from "@prisma/client";
import { legKey } from "../recommendations/driving-leg.repository.js";
import { stubOpportunityPayloadFromCandidate } from "../recommendations/recommendation-stub-payload.js";
import type { RecommendationCandidate } from "../recommendations/types.js";
import { maxDrivingDistanceMetersFromMiles } from "./repository.js";
import { OpportunitySearchService } from "./service.js";
import type {
  OpportunitySearchCandidateRow,
  OpportunitySearchDrivingLegRow,
} from "./types.js";
import { StatusCodes } from "http-status-codes";

/** Leg snapshot endpoints ~5 mi apart (straight line); stub driving metres should stay in the same ballpark. */
const SNAP_PARENT_LAT = "51.5074";
const SNAP_PARENT_LON = "-0.1278";
const SNAP_OPP_LAT = "51.5799";
const SNAP_OPP_LON = "-0.1278";

function candidateRow(
  id: string,
  type: OpportunityRecordType,
  overrides: Partial<OpportunitySearchCandidateRow> = {},
): OpportunitySearchCandidateRow {
  return {
    type,
    id,
    interestTags: "woodland_walks",
    themeSlug: "animal_encounters",
    latitude: "51.751393",
    longitude: "-0.471936",
    generalFacilitySlugs: ["toilets"],
    kidsFacilitySlugs: ["play_equipment"],
    parentFacilitySlugs: ["hot_drinks"],
    dogFacilitySlugs: [],
    ...overrides,
  };
}

function drivingLeg(
  type: OpportunityRecordType,
  opportunityId: string,
  drivingDistanceMeters: number,
  drivingDurationSeconds: number,
): OpportunitySearchDrivingLegRow {
  return {
    opportunityType: type,
    opportunityId,
    drivingDistanceMeters,
    drivingDurationSeconds,
    parentLatitude: SNAP_PARENT_LAT,
    parentLongitude: SNAP_PARENT_LON,
    opportunityLatitude: SNAP_OPP_LAT,
    opportunityLongitude: SNAP_OPP_LON,
  };
}

function toRecommendationCandidate(c: OpportunitySearchCandidateRow): RecommendationCandidate {
  return {
    type: c.type,
    id: c.id,
    name: `name-${c.id}`,
    description: null,
    postcode: "HP1 1BB",
    latitude: c.latitude,
    longitude: c.longitude,
    interestTags: c.interestTags,
    themeSlug: c.themeSlug,
    ageSuitabilitySlugs: [],
    skillAreaSlug: null,
    skillAreaVariant: null,
  };
}

describe("maxDrivingDistanceMetersFromMiles", () => {
  it("converts miles to meters with a floor", () => {
    expect(maxDrivingDistanceMetersFromMiles(1)).toBe(1609);
  });
});

describe("OpportunitySearchService", () => {
  const parentLondon = { latitude: "51.5074", longitude: "-0.1278" };

  it("throws when parent is missing", async () => {
    const searchRepo = {
      findParentLatLon: vi.fn(async () => null),
      findChildInterestSubCategorySlugs: vi.fn(),
      findFacilityBySlug: vi.fn(async (s: string) => ({ slug: s.trim().toLowerCase() })),
      listDrivingLegsForParent: vi.fn(),
      findCandidatesByRefs: vi.fn(),
    };
    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(),
    };
    const service = new OpportunitySearchService(searchRepo, enrichRepo);
    await expect(
      service.search({
        parentId: "00000000-0000-4000-8000-000000000001",
        interestSubCategorySlug: "woodland_walks",
        maxTimeToReachMinutes: 60,
        maxDistanceMiles: 20,
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.NOT_FOUND,
      message: "Parent not found.",
    });
    expect(searchRepo.listDrivingLegsForParent).not.toHaveBeenCalled();
  });

  it("throws when parent coordinates are not numeric", async () => {
    const searchRepo = {
      findParentLatLon: vi.fn(async () => ({ latitude: "x", longitude: "0" })),
      findChildInterestSubCategorySlugs: vi.fn(),
      findFacilityBySlug: vi.fn(async (s: string) => ({ slug: s.trim().toLowerCase() })),
      listDrivingLegsForParent: vi.fn(),
      findCandidatesByRefs: vi.fn(),
    };
    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(),
    };
    const service = new OpportunitySearchService(searchRepo, enrichRepo);
    await expect(
      service.search({
        parentId: "00000000-0000-4000-8000-000000000002",
        interestSubCategorySlug: "woodland_walks",
        maxTimeToReachMinutes: 60,
        maxDistanceMiles: 20,
      }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
    });
  });

  it("returns venues that match interest slug, time, and driving distance (two parents / legs)", async () => {
    const parentIdAlice = "00000000-0000-4000-8000-0000000000a1";
    const parentIdBob = "00000000-0000-4000-8000-0000000000b2";

    const venueMatch = candidateRow("venue-a", "venue", {
      interestTags: "woodland_walks",
      themeSlug: "something_else",
    });
    const venueWrongInterest = candidateRow("venue-b", "venue", {
      interestTags: "other_tag",
      themeSlug: "other_theme",
    });
    const venueThemeOnly = candidateRow("venue-c", "venue", {
      interestTags: null,
      themeSlug: "animal_encounters",
    });

    const legsAlice: OpportunitySearchDrivingLegRow[] = [
      drivingLeg("venue", "venue-a", 8000, 900),
      drivingLeg("venue", "venue-b", 5000, 400),
    ];
    const legsBob: OpportunitySearchDrivingLegRow[] = [
      drivingLeg("venue", "venue-c", 3000, 600),
    ];

    const searchRepo = {
      findParentLatLon: vi.fn(async (id: string) => {
        if (id === parentIdAlice) return parentLondon;
        if (id === parentIdBob) return parentLondon;
        return null;
      }),
      findChildInterestSubCategorySlugs: vi.fn(),
      findFacilityBySlug: vi.fn(async (s: string) => ({ slug: s.trim().toLowerCase() })),
      listDrivingLegsForParent: vi.fn(
        async (
          parentId: string,
          opts: { maxDurationSeconds?: number; maxDistanceMeters?: number },
        ) => {
          expect(opts.maxDurationSeconds).toBe(30 * 60);
          expect(opts.maxDistanceMeters).toBe(maxDrivingDistanceMetersFromMiles(15));
          if (parentId === parentIdAlice) return legsAlice;
          if (parentId === parentIdBob) return legsBob;
          return [];
        },
      ),
      findCandidatesByRefs: vi.fn(async () => [venueMatch, venueWrongInterest, venueThemeOnly]),
    };

    const payloadMap = new Map(
      [venueMatch, venueWrongInterest, venueThemeOnly].map((c) => [
        legKey(c.type, c.id),
        stubOpportunityPayloadFromCandidate(toRecommendationCandidate(c)),
      ]),
    );

    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(async (refs) => {
        const m = new Map<string, (typeof payloadMap extends Map<string, infer V> ? V : never)>();
        for (const r of refs) {
          const p = payloadMap.get(legKey(r.type, r.id));
          if (p) m.set(legKey(r.type, r.id), p);
        }
        return m;
      }),
    };

    const service = new OpportunitySearchService(searchRepo, enrichRepo);

    const aliceWoodland = await service.search({
      parentId: parentIdAlice,
      interestSubCategorySlug: "woodland_walks",
      maxTimeToReachMinutes: 30,
      maxDistanceMiles: 15,
    });
    expect(aliceWoodland).toHaveLength(1);
    expect(aliceWoodland[0]!.id).toBe("venue-a");
    expect(aliceWoodland[0]!.drivingDurationSeconds).toBe(900);
    expect(aliceWoodland[0]!.drivingDistanceMiles).toBeGreaterThan(0);

    const bobTheme = await service.search({
      parentId: parentIdBob,
      interestSubCategorySlug: "animal_encounters",
      maxTimeToReachMinutes: 30,
      maxDistanceMiles: 15,
    });
    expect(bobTheme).toHaveLength(1);
    expect(bobTheme[0]!.id).toBe("venue-c");

    const aliceNoMatch = await service.search({
      parentId: parentIdAlice,
      interestSubCategorySlug: "animal_encounters",
      maxTimeToReachMinutes: 30,
      maxDistanceMiles: 15,
    });
    expect(aliceNoMatch).toHaveLength(0);
  });

  it("sorts by driving duration then driving distance", async () => {
    const parentId = "00000000-0000-4000-8000-000000000099";
    const v1 = candidateRow("v1", "venue", { interestTags: "zoo_visits" });
    const v2 = candidateRow("v2", "venue", { interestTags: "zoo_visits" });
    const v3 = candidateRow("v3", "venue", { interestTags: "zoo_visits" });

    const legs = [
      drivingLeg("venue", "v2", 5000, 1200),
      drivingLeg("venue", "v1", 4000, 600),
      drivingLeg("venue", "v3", 4000, 600),
    ];

    const searchRepo = {
      findParentLatLon: vi.fn(async () => parentLondon),
      findChildInterestSubCategorySlugs: vi.fn(),
      findFacilityBySlug: vi.fn(async (s: string) => ({ slug: s.trim().toLowerCase() })),
      listDrivingLegsForParent: vi.fn(async () => legs),
      findCandidatesByRefs: vi.fn(async () => [v1, v2, v3]),
    };

    const payloadMap = new Map(
      [v1, v2, v3].map((c) => [
        legKey(c.type, c.id),
        stubOpportunityPayloadFromCandidate(toRecommendationCandidate(c)),
      ]),
    );

    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(async (refs) => {
        const m = new Map<string, (typeof payloadMap extends Map<string, infer V> ? V : never)>();
        for (const r of refs) {
          const p = payloadMap.get(legKey(r.type, r.id));
          if (p) m.set(legKey(r.type, r.id), p);
        }
        return m;
      }),
    };

    const service = new OpportunitySearchService(searchRepo, enrichRepo);
    const data = await service.search({
      parentId,
      interestSubCategorySlug: "zoo_visits",
      maxTimeToReachMinutes: 60,
      maxDistanceMiles: 50,
    });

    expect(data.map((x) => x.id)).toEqual(["v1", "v3", "v2"]);
  });

  it("omitting interest and time/distance filters returns all legs for the parent", async () => {
    const parentId = "00000000-0000-4000-8000-0000000000d1";
    const v1 = candidateRow("x1", "venue", { interestTags: "a" });
    const v2 = candidateRow("x2", "venue", { interestTags: "b" });
    const legs = [drivingLeg("venue", "x1", 1000, 100), drivingLeg("venue", "x2", 2000, 200)];

    const searchRepo = {
      findParentLatLon: vi.fn(async () => parentLondon),
      findChildInterestSubCategorySlugs: vi.fn(),
      findFacilityBySlug: vi.fn(async (s: string) => ({ slug: s.trim().toLowerCase() })),
      listDrivingLegsForParent: vi.fn(async (_pid, opts) => {
        expect(opts).toEqual({});
        return legs;
      }),
      findCandidatesByRefs: vi.fn(async () => [v1, v2]),
    };
    const payloadMap = new Map(
      [v1, v2].map((c) => [
        legKey(c.type, c.id),
        stubOpportunityPayloadFromCandidate(toRecommendationCandidate(c)),
      ]),
    );
    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(async (refs) => {
        const m = new Map<string, (typeof payloadMap extends Map<string, infer V> ? V : never)>();
        for (const r of refs) {
          const p = payloadMap.get(legKey(r.type, r.id));
          if (p) m.set(legKey(r.type, r.id), p);
        }
        return m;
      }),
    };
    const service = new OpportunitySearchService(searchRepo, enrichRepo);
    const data = await service.search({ parentId });
    expect(data).toHaveLength(2);
    expect(data.map((x) => x.id).sort()).toEqual(["x1", "x2"]);
  });

  it("when childId is set, requires that subcategory on the child profile", async () => {
    const parentId = "00000000-0000-4000-8000-0000000000c1";
    const childId = "00000000-0000-4000-8000-0000000000c2";

    const searchRepo = {
      findParentLatLon: vi.fn(async () => parentLondon),
      findChildInterestSubCategorySlugs: vi.fn(async () => ["woodland_walks"]),
      findFacilityBySlug: vi.fn(async (s: string) => ({ slug: s.trim().toLowerCase() })),
      listDrivingLegsForParent: vi.fn(),
      findCandidatesByRefs: vi.fn(),
    };
    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(),
    };
    const service = new OpportunitySearchService(searchRepo, enrichRepo);

    await expect(
      service.search({
        parentId,
        childId,
        interestSubCategorySlug: "other_slug",
        maxTimeToReachMinutes: 30,
        maxDistanceMiles: 15,
      }),
    ).rejects.toMatchObject({ statusCode: StatusCodes.BAD_REQUEST });

    expect(searchRepo.findChildInterestSubCategorySlugs).toHaveBeenCalledWith(parentId, childId);
    expect(searchRepo.listDrivingLegsForParent).not.toHaveBeenCalled();
  });

  it("rejects unknown facility slug before loading legs", async () => {
    const parentId = "00000000-0000-4000-8000-0000000000e1";
    const searchRepo = {
      findParentLatLon: vi.fn(async () => parentLondon),
      findChildInterestSubCategorySlugs: vi.fn(),
      findFacilityBySlug: vi.fn(async () => null),
      listDrivingLegsForParent: vi.fn(),
      findCandidatesByRefs: vi.fn(),
    };
    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(),
    };
    const service = new OpportunitySearchService(searchRepo, enrichRepo);
    await expect(
      service.search({ parentId, facility: ["not_a_real_facility_slug"] }),
    ).rejects.toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Unknown facility slug.",
    });
    expect(searchRepo.listDrivingLegsForParent).not.toHaveBeenCalled();
  });

  it("filters by facility slug on any facility array (venue parent vs route dog)", async () => {
    const parentId = "00000000-0000-4000-8000-0000000000e2";
    const va = candidateRow("fa", "venue", {
      parentFacilitySlugs: ["wifi"],
      generalFacilitySlugs: [],
      kidsFacilitySlugs: [],
    });
    const vb = candidateRow("fb", "venue", {
      parentFacilitySlugs: ["snacks"],
      generalFacilitySlugs: ["toilets"],
      kidsFacilitySlugs: [],
    });
    const rc = candidateRow("fc", "route", {
      parentFacilitySlugs: [],
      generalFacilitySlugs: [],
      kidsFacilitySlugs: [],
      dogFacilitySlugs: ["dog_bins"],
    });
    const legs = [
      drivingLeg("venue", "fa", 1000, 100),
      drivingLeg("venue", "fb", 2000, 200),
      drivingLeg("route", "fc", 3000, 300),
    ];
    const searchRepo = {
      findParentLatLon: vi.fn(async () => parentLondon),
      findChildInterestSubCategorySlugs: vi.fn(),
      findFacilityBySlug: vi.fn(async (s: string) => ({ slug: s.trim().toLowerCase() })),
      listDrivingLegsForParent: vi.fn(async () => legs),
      findCandidatesByRefs: vi.fn(async () => [va, vb, rc]),
    };
    const payloadMap = new Map(
      [va, vb, rc].map((c) => [
        legKey(c.type, c.id),
        stubOpportunityPayloadFromCandidate(toRecommendationCandidate(c)),
      ]),
    );
    const enrichRepo = {
      getEnrichedOpportunityPayloadsForRecommendations: vi.fn(async (refs) => {
        const m = new Map<string, (typeof payloadMap extends Map<string, infer V> ? V : never)>();
        for (const r of refs) {
          const p = payloadMap.get(legKey(r.type, r.id));
          if (p) m.set(legKey(r.type, r.id), p);
        }
        return m;
      }),
    };
    const service = new OpportunitySearchService(searchRepo, enrichRepo);

    const wifiOnly = await service.search({ parentId, facility: ["wifi"] });
    expect(wifiOnly.map((x) => x.id)).toEqual(["fa"]);

    const dogOnly = await service.search({ parentId, facility: ["dog_bins"] });
    expect(dogOnly.map((x) => x.id)).toEqual(["fc"]);

    const wifiOrDog = await service.search({ parentId, facility: ["wifi", "dog_bins"] });
    expect(wifiOrDog.map((x) => x.id)).toEqual(["fa", "fc"]);
  });
});
