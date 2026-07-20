export interface AbilityLevelEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const ABILITY_LEVEL_ENUM: AbilityLevelEntry[] = [
  { name: "None / Novice", slug: "novice", active: true },
  { name: "Beginner", slug: "beginner", active: true },
  { name: "Intermediate", slug: "intermediate", active: true },
  { name: "Expert", slug: "expert", active: true },
];

export type AbilityLevelSlug = (typeof ABILITY_LEVEL_ENUM)[number]["slug"];
