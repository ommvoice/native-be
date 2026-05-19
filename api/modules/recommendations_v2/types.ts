import type { OpportunityRecordType } from "@prisma/client";
import type { OpportunityVenueV2Response as OpportunityEventV2Response } from "../opportunity/events_v2/types.js";
import type { OpportunityClubV2Response } from "../opportunity/clubs_v2/types.js";
import type { OpportunityRouteV2Response } from "../opportunity/routes_v2/types.js";
import type { OpportunityVenuesV2Response } from "../opportunity/venues_v2/types.js";

export interface RecommendationScoreBreakdown {
  interestScore: number;
  ageScore: number;
  distanceScore: number;
  total: number;
}

/** Internal row before full opportunity payload is merged (scoring + driving fields only). */
export interface ScoredRecommendation {
  type: OpportunityRecordType;
  id: string;
  name: string;
  description: string | null;
  postcode: string | null;
  /**
   * Great-circle (“as the crow flies”) distance in **miles** between parent and opportunity
   * coordinates (WGS84). This is **not** driving or walking distance; road routes from Google
   * Maps (or similar) are typically longer.
   */
  distanceMiles: number | null;
  /** Mapbox `mapbox/driving` distance when cached or freshly fetched; null if unroutable or no token/cache. */
  drivingDistanceMiles: number | null;
  /** Driving duration in seconds (Mapbox). */
  drivingDurationSeconds: number | null;
  score: number;
  scoreBreakdown: RecommendationScoreBreakdown;
}

/**
 * V2 spreadsheet age-suitability booleans (e.g. on routes:
 * `route_age_suitability_under_1_s` … `route_age_suitability_adults`).
 * Same seven bands exist on venue / event / club v2 models with their own column names.
 */
export interface RecommendationV2AgeBands {
  under1: boolean | null;
  ages1To2: boolean | null;
  ages3To4: boolean | null;
  ages5To7: boolean | null;
  ages8To12: boolean | null;
  over13: boolean | null;
  adults: boolean | null;
}

/**
 * Minimal v2 opportunity row used for scoring and driving snapshots.
 * Loaded columns match v2 spreadsheet imports (ids, geo, theme FKs, postcode); display fields are placeholders until wired.
 */
export interface RecommendationV2Candidate {
  type: OpportunityRecordType;
  id: string;
  name: string;
  description: string | null;
  postcode: string | null;
  latitude: string | null;
  longitude: string | null;
  /** Resolved slug for `*_opportunity_theme_id` (used for interest overlap). */
  themeSlug: string;
  /** Resolved slug for `*_opportunity_theme_variant_id` (used for interest overlap). */
  themeVariantSlug: string;
  ageBands: RecommendationV2AgeBands;
  skillAreaSlug: string | null;
  skillAreaVariant: string | null;
}

export type RecommendationV2OpportunityPayload =
  | OpportunityVenuesV2Response
  | OpportunityEventV2Response
  | OpportunityClubV2Response
  | OpportunityRouteV2Response;

/** API list item: full v2 opportunity payload plus recommendation scoring. */
export type EnrichedScoredRecommendationV2 = RecommendationV2OpportunityPayload & {
  distanceMiles: number | null;
  drivingDistanceMiles: number | null;
  drivingDurationSeconds: number | null;
  score: number;
  scoreBreakdown: RecommendationScoreBreakdown;
};
