export interface SkillAreaEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const SKILL_AREA_ENUM: SkillAreaEntry[] = [
  { name: "Sport", slug: "sport", active: true },
  { name: "Creative Arts", slug: "creative_arts", active: true },
  { name: "Academic", slug: "academic", active: true },
  { name: "Social & emotional", slug: "social_emotional", active: true },
  { name: "Life Skills", slug: "life_skills", active: true },
  { name: "Technical Skills", slug: "technical_skills", active: true },
  { name: "Outdoors & Nature", slug: "outdoor_nature", active: true },
  { name: "Global Awareness", slug: "global_awareness", active: true },
  { name: "Digital, media & modern", slug: "digital_media_modern", active: true },
  { name: "Crafting & Art", slug: "crafting_art", active: true },
  { name: "Sensory or SEND", slug: "sensory_play", active: true },
];

export type SkillAreaSlug = (typeof SKILL_AREA_ENUM)[number]["slug"];
