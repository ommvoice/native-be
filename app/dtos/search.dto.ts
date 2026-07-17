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
}
