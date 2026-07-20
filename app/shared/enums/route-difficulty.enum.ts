export interface RouteDifficultyEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const ROUTE_DIFFICULTY_ENUM: RouteDifficultyEntry[] = [
  { name: "Easy", slug: "easy", active: true },
  { name: "Moderate", slug: "moderate", active: true },
  { name: "Challenging", slug: "challenging", active: true },
];

export type RouteDifficultySlug = (typeof ROUTE_DIFFICULTY_ENUM)[number]["slug"];
