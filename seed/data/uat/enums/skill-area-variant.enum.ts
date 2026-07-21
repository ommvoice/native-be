export interface SkillAreaVariantEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const SKILL_AREA_VARIANT_ENUM: SkillAreaVariantEntry[] = [
  { name: "Team Sports", slug: "team_sports", relatedEnumNameSlugs: ["sport"], active: true },
  { name: "Racquet Sports", slug: "racquet_sports", relatedEnumNameSlugs: ["sport"], active: true },
  { name: "Swimming & Water Sports", slug: "swimming_water_sports", relatedEnumNameSlugs: ["sport"], active: true },
  { name: "Gymnastics & Martial Arts", slug: "gymnastics_martial_arts", relatedEnumNameSlugs: ["sport"], active: true },
  { name: "Athletics & Running", slug: "athletics_running", relatedEnumNameSlugs: ["sport"], active: true },
  { name: "Cycling & Skating", slug: "cycling_skating", relatedEnumNameSlugs: ["sport"], active: true },
  { name: "Climbing", slug: "climbing", relatedEnumNameSlugs: ["sport"], active: true },
  { name: "Multi-Sport", slug: "multi_sport", relatedEnumNameSlugs: ["sport"], active: true },
];

export type SkillAreaVariantSlug = (typeof SKILL_AREA_VARIANT_ENUM)[number]["slug"];
