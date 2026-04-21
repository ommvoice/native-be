export interface RecommendationQueryDto {
  parentId: string;
  /** If set, only that child's ages and interests contribute (parent interests still apply). */
  childId?: string;
}
