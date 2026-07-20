export interface OpportunityThemeEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const OPPORTUNITY_THEME_ENUM: OpportunityThemeEntry[] = [
  { name: "Scenic Walks & Trails", slug: "scenic_walks", relatedEnumNameSlugs: ["route", "event", "club", "nature_exploration"], active: true },
  { name: "Green Open Spaces", slug: "green_spaces", relatedEnumNameSlugs: ["venue", "event", "club", "nature_exploration"], active: true },
  { name: "Nature & Wildlife Exploration", slug: "nature_wildlife", relatedEnumNameSlugs: ["route", "venue", "event", "club", "nature_exploration"], active: true },
  { name: "Coastal Adventures", slug: "coastal_adventures", relatedEnumNameSlugs: ["venue", "event", "club", "nature_exploration"], active: true },
  { name: "Gardens & Curated Outdoor Spaces", slug: "gardens_outdoor", relatedEnumNameSlugs: ["venue", "event", "club", "nature_exploration"], active: true },
  { name: "Playgrounds & Adventure Parks", slug: "active_play", relatedEnumNameSlugs: ["venue", "event", "club", "movement_energy"], active: true },
  { name: "Sporty Activities", slug: "sporty_activities", relatedEnumNameSlugs: ["venue", "event", "club", "movement_energy"], active: true },
  { name: "Rideable Routes", slug: "wheels_routes", relatedEnumNameSlugs: ["route", "event", "club", "venue", "movement_energy"], active: true },
  { name: "Water Activities", slug: "water_fun", relatedEnumNameSlugs: ["venue", "event", "club", "nature_exploration", "movement_energy"], active: true },
  { name: "Creative Activities", slug: "creative_play", relatedEnumNameSlugs: ["venue", "event", "club", "creativity_imagination"], active: true },
  { name: "Imaginative & Role Play", slug: "imaginative_play", relatedEnumNameSlugs: ["venue", "event", "club", "creativity_imagination"], active: true },
  { name: "Sensory or Calming Experiences", slug: "sensory_soothing", relatedEnumNameSlugs: ["venue", "event", "club", "slowing_down"], active: true },
  { name: "Hands-On Learning", slug: "hands_on_learning", relatedEnumNameSlugs: ["venue", "event", "club", "movement_energy", "learning_curiosity"], active: true },
  { name: "Museums & Discovery", slug: "interactive_museums", relatedEnumNameSlugs: ["venue", "event", "club", "creativity_imagination", "learning_curiosity"], active: true },
  { name: "History & Culture", slug: "historical_cultural", relatedEnumNameSlugs: ["venue", "event", "club", "creativity_imagination", "learning_curiosity"], active: true },
  { name: "Animal Encounters", slug: "animal_encounters", relatedEnumNameSlugs: ["venue", "event", "club", "learning_curiosity"], active: true },
  { name: "Soft Play & Indoor Active Play", slug: "soft_play", relatedEnumNameSlugs: ["venue", "event", "movement_energy"], active: true },
  { name: "Indoor Entertainment", slug: "indoor_entertainment", relatedEnumNameSlugs: ["venue", "club", "event", "creativity_imagination", "together_time", "special_memorable"], active: true },
  { name: "Transport & Engineering", slug: "vehicles_transport", relatedEnumNameSlugs: ["venue", "event", "club", "learning_curiosity"], active: true },
  { name: "A Big Day Out", slug: "big_day_out", relatedEnumNameSlugs: ["venue", "event", "together_time", "special_memorable"], active: true },
  { name: "Cafés & Coffee Stops", slug: "relaxed_cafe", relatedEnumNameSlugs: ["venue", "slowing_down", "together_time"], active: true },
  { name: "Family Dining", slug: "family_dining", relatedEnumNameSlugs: ["venue", "together_time"], active: true },
  { name: "Seasonal", slug: "seasonal", relatedEnumNameSlugs: ["venue", "event", "club"], active: true },
];

export type OpportunityThemeSlug = (typeof OPPORTUNITY_THEME_ENUM)[number]["slug"];
