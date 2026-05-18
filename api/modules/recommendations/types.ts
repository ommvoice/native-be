import type { OpportunityRecordType } from "../../types/db.js";
import type { OpportunityClubResponse } from "../opportunity/clubs/types.js";
import type { OpportunityEventResponse } from "../opportunity/events/types.js";
import type { OpportunityRouteResponse } from "../opportunity/routes/types.js";
import type { OpportunityVenueResponse } from "../opportunity/venues/types.js";

/** Same values as Prisma `OpportunityRecordType` on opportunity tables. */
export type RecommendationOpportunityType = OpportunityRecordType;

/** Same enriched shape as `GET /opportunities/.../:id` (venue, event, club, or route). */
export type RecommendationOpportunityPayload =
  | OpportunityVenueResponse
  | OpportunityEventResponse
  | OpportunityClubResponse
  | OpportunityRouteResponse;

export interface RecommendationCandidate {
  type: RecommendationOpportunityType;
  id: string;
  name: string;
  description: string | null;
  postcode: string | null;
  /** WGS84 strings from DB; required for distance scoring when non-empty. */
  latitude: string | null;
  longitude: string | null;
  interestTags: string | null;
  themeSlug: string;
  ageSuitabilitySlugs: string[];
  /** Events/clubs only; null for venues/routes. Matched against children's skill + subcategory slugs (age-filtered). */
  skillAreaSlug?: string | null;
  skillAreaVariant?: string | null;
}

export interface RecommendationScoreBreakdown {
  interestScore: number;
  skillScore: number;
  ageScore: number;
  distanceScore: number;
  total: number;
}

/** Internal row before full opportunity payload is merged (scoring + driving fields only). */
export interface ScoredRecommendation {
  type: RecommendationOpportunityType;
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

/** API list item: full opportunity (same fields as opportunity getById) plus recommendation scoring. */
export type EnrichedScoredRecommendation = RecommendationOpportunityPayload & {
  distanceMiles: number | null;
  drivingDistanceMiles: number | null;
  drivingDurationSeconds: number | null;
  score: number;
  scoreBreakdown: RecommendationScoreBreakdown;
};
