export interface RecommendationRequestDto {
  parentId: string;
  /** Query latitude; longitude is read from the parent profile in the service. */
  latitude: number;
  categories?: string[];
}

export interface ScoredOpportunity {
  id: string;
  name: string;
  description: string | null;
  category: string;
  city: string | null;
  /** Great-circle distance in **miles** (UK). */
  distanceMiles: number;
  isFree: boolean;
  entryCost: string | null;
  activityEffortTag: string | null;
  estimatedVisitDuration: string | null;
  imageUrls: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  ageScore: number;
  distanceScore: number;
  costScore: number;
  effortScore: number;
  accessibilityScore: number;
  total: number;
}
