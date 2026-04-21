import type { OpportunityRecordType } from "@prisma/client";
import type { RecommendationOpportunityPayload } from "../recommendations/types.js";

export type OpportunitySearchQueryDto = {
  parentId: string;
  /** When set, opportunities must match this slug via `interestTags` or `themeSlug`. */
  interestSubCategorySlug?: string;
  /** When set, legs must have `drivingDurationSeconds` ≤ this many minutes. */
  maxTimeToReachMinutes?: number;
  /** When set, legs must have driving distance ≤ this many miles. */
  maxDistanceMiles?: number;
  /**
   * When set, the child must belong to the parent. If `interestSubCategorySlug` is also set, it must
   * appear on the child’s profile.
   */
  childId?: string;
  /**
   * When set, each slug must exist in `facilities.slug`. An opportunity matches if it lists **any**
   * of these slugs on general/kids/parent/dog facility arrays (same as query param `facility`, comma-separated).
   */
  facility?: string[];
};

export type OpportunitySearchDrivingLegRow = {
  opportunityType: OpportunityRecordType;
  opportunityId: string;
  drivingDistanceMeters: number;
  drivingDurationSeconds: number;
  /** WGS84 strings as stored when the leg was cached (same endpoints Mapbox used). */
  parentLatitude: string;
  parentLongitude: string;
  opportunityLatitude: string;
  opportunityLongitude: string;
};

/** Minimal opportunity row for interest + facility matching (crow-fly uses leg snapshot coords in the service). */
export type OpportunitySearchCandidateRow = {
  type: OpportunityRecordType;
  id: string;
  interestTags: string | null;
  themeSlug: string;
  latitude: string | null;
  longitude: string | null;
  generalFacilitySlugs: string[];
  kidsFacilitySlugs: string[];
  parentFacilitySlugs: string[];
  /** From DB for venues/routes; empty for events/clubs. */
  dogFacilitySlugs: string[];
};

export type OpportunitySearchResultItem = RecommendationOpportunityPayload & {
  distanceMiles: number | null;
  drivingDistanceMiles: number | null;
  drivingDurationSeconds: number | null;
};
