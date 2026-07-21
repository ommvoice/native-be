export interface InterestCategoryEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const INTEREST_CATEGORY_ENUM: InterestCategoryEntry[] = [
  { name: "Nature & Exploration", slug: "nature_exploration", active: true },
  { name: "Movement & Energy", slug: "movement_energy", active: true },
  { name: "Creativity & Imagination", slug: "creativity_imagination", active: true },
  { name: "Learning & Curiosity", slug: "learning_curiosity", active: true },
  { name: "Slowing Down", slug: "slowing_down", active: true },
  { name: "Family Resets", slug: "together_time", active: true },
  { name: "Special & Memorable Days Out", slug: "special_memorable", active: true },
];

export type InterestCategorySlug = (typeof INTEREST_CATEGORY_ENUM)[number]["slug"];
