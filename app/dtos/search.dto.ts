export interface OpportunitySearchQueryDto {
  parentId: string;
  childId?: string;
  interestSubCategorySlug?: string;
  facility?: string[];
  maxDistanceMiles?: number;
  maxTimeToReachMinutes?: number;
}
