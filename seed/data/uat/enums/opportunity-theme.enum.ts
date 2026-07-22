export interface OpportunityThemeEntry {
  name: string;
  slug: string;
  opportunityTypeSlugs?: string[];
  interestCategorySlugs?: string[];
  active: boolean;
}

export const OPPORTUNITY_THEME_ENUM: OpportunityThemeEntry[] = [
  { name: "Scenic Walks & Trails", slug: "scenic_walks", opportunityTypeSlugs: ["route", "event", "club"], interestCategorySlugs: ["nature_exploration"], active: true },
  { name: "Green Open Spaces", slug: "green_spaces", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["nature_exploration"], active: true },
  { name: "Nature & Wildlife Exploration", slug: "nature_wildlife", opportunityTypeSlugs: ["route", "venue", "event", "club"], interestCategorySlugs: ["nature_exploration"], active: true },
  { name: "Coastal Adventures", slug: "coastal_adventures", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["nature_exploration"], active: true },
  { name: "Gardens & Curated Outdoor Spaces", slug: "gardens_outdoor", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["nature_exploration"], active: true },
  { name: "Playgrounds & Adventure Parks", slug: "active_play", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["movement_energy"], active: true },
  { name: "Sporty Activities", slug: "sporty_activities", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["movement_energy"], active: true },
  { name: "Rideable Routes", slug: "wheels_routes", opportunityTypeSlugs: ["route", "event", "club", "venue"], interestCategorySlugs: ["movement_energy"], active: true },
  { name: "Water Activities", slug: "water_fun", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["nature_exploration", "movement_energy"], active: true },
  { name: "Creative Activities", slug: "creative_play", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["creativity_imagination"], active: true },
  { name: "Imaginative & Role Play", slug: "imaginative_play", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["creativity_imagination"], active: true },
  { name: "Sensory or Calming Experiences", slug: "sensory_soothing", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["slowing_down"], active: true },
  { name: "Hands-On Learning", slug: "hands_on_learning", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["movement_energy", "learning_curiosity"], active: true },
  { name: "Museums & Discovery", slug: "interactive_museums", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["creativity_imagination", "learning_curiosity"], active: true },
  { name: "History & Culture", slug: "historical_cultural", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["creativity_imagination", "learning_curiosity"], active: true },
  { name: "Animal Encounters", slug: "animal_encounters", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["learning_curiosity"], active: true },
  { name: "Soft Play & Indoor Active Play", slug: "soft_play", opportunityTypeSlugs: ["venue", "event"], interestCategorySlugs: ["movement_energy"], active: true },
  { name: "Indoor Entertainment", slug: "indoor_entertainment", opportunityTypeSlugs: ["venue", "club", "event"], interestCategorySlugs: ["creativity_imagination", "together_time", "special_memorable"], active: true },
  { name: "Transport & Engineering", slug: "vehicles_transport", opportunityTypeSlugs: ["venue", "event", "club"], interestCategorySlugs: ["learning_curiosity"], active: true },
  { name: "A Big Day Out", slug: "big_day_out", opportunityTypeSlugs: ["venue", "event"], interestCategorySlugs: ["together_time", "special_memorable"], active: true },
  { name: "Cafés & Coffee Stops", slug: "relaxed_cafe", opportunityTypeSlugs: ["venue"], interestCategorySlugs: ["slowing_down", "together_time"], active: true },
  { name: "Family Dining", slug: "family_dining", opportunityTypeSlugs: ["venue"], interestCategorySlugs: ["together_time"], active: true },
  { name: "Seasonal", slug: "seasonal", opportunityTypeSlugs: ["venue", "event", "club"], active: true },
];

export type OpportunityThemeSlug = (typeof OPPORTUNITY_THEME_ENUM)[number]["slug"];
