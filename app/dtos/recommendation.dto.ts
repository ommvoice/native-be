export interface RecommendationQueryDto {
  parentId: string;
  childId?: string;
  opportunityLat? :  string;
  opportunityLong? :  string;
}

export interface ScoreBreakdown {
  interestScore: number;
  ageScore: number;
  distanceScore: number;
  total: number;
}

export interface RecommendationV2AgeBands {
  under1:   boolean | null;
  ages1To2: boolean | null;
  ages3To4: boolean | null;
  ages5To7: boolean | null;
  ages8To12: boolean | null;
  over13:   boolean | null;
  adults:   boolean | null;
}

export interface RecommendationV2Candidate {
  type: 'venue' | 'event' | 'club' | 'route';
  id: string;
  name: string;
  description: string | null;
  postcode: string | null;
  latitude: string | null;
  longitude: string | null;
  themeSlug: string;
  themeVariantSlug: string;
  ageBands: RecommendationV2AgeBands;
  skillAreaSlug: string | null;
  skillAreaVariant: string | null;
  /** Free-text interest tags (e.g. "birdsong", "cycling") — matched against children's own interestTags. */
  tags: string[];
  startDate?: string | null;
  endDate?: string | null;
  activeDays?: string[];
  /** Today's session start/end time-of-day, e.g. "14:00" — used for the 1hr starting-soon/just-ended scoring window. */
  startTime?: string | null;
  endTime?: string | null;
}
