export interface GeneralSkillEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const GENERAL_SKILL_ENUM: GeneralSkillEntry[] = [
  { name: "Balance Biking", slug: "balance_biking", active: true },
  { name: "Cycling", slug: "cycling", active: true },
  { name: "Scootering", slug: "scootering", active: true },
  { name: "Hiking", slug: "hiking", active: true },
  { name: "Swimming", slug: "swimming", active: true },
];

export type GeneralSkillSlug = (typeof GENERAL_SKILL_ENUM)[number]["slug"];
