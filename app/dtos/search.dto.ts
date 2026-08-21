export interface OpportunitySearchQueryDto {
  parentId: string;
  childId?: string;
  interestSubCategorySlug?: string;
  facility?: string[];
  maxDistanceMiles?: number;
  maxTimeToReachMinutes?: number;

  // ── Extended filters — matches native-fe-v0's FilterState ────────────────
  themeSlug?: string;
  themeVariantSlug?: string[];
  routeDifficulty?: string[];
  routeType?: string[];
  routeMaxLengthMiles?: number;
  routeSuitability?: string[];
  attractions?: string[];
  searchRadius?: string;

  /** Which scoring dimensions to skip (treat as an automatic 100 instead of
   * scoring for real) — "all" skips every dimension, otherwise a comma-
   * separated list of: interests, interestTags, ages, weather, schedule,
   * distance. Absent/empty means score everything normally. */
  skipRecommendations?: string[];
}
