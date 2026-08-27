export interface SkillAreaVariantEntry {
  name: string;
  slug: string;
  skillAreaSlugs?: string[];
  active: boolean;
}

export const SKILL_AREA_VARIANT_ENUM: SkillAreaVariantEntry[] = [
  { name: "Team Sports", slug: "team_sports", skillAreaSlugs: ["sport"], active: true },
  { name: "Racquet Sports", slug: "racquet_sports", skillAreaSlugs: ["sport"], active: true },
  { name: "Swimming & Water Sports", slug: "swimming_water_sports", skillAreaSlugs: ["sport"], active: true },
  { name: "Gymnastics & Martial Arts", slug: "gymnastics_martial_arts", skillAreaSlugs: ["sport"], active: true },
  { name: "Athletics & Running", slug: "athletics_running", skillAreaSlugs: ["sport"], active: true },
  { name: "Cycling & Skating", slug: "cycling_skating", skillAreaSlugs: ["sport"], active: true },
  { name: "Climbing", slug: "climbing", skillAreaSlugs: ["sport"], active: true },
  { name: "Multi-Sport", slug: "multi_sport", skillAreaSlugs: ["sport"], active: true },
];

export type SkillAreaVariantSlug = (typeof SKILL_AREA_VARIANT_ENUM)[number]["slug"];
