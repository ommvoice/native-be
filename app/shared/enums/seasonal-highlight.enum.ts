export interface SeasonalHighlightEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const SEASONAL_HIGHLIGHT_ENUM: SeasonalHighlightEntry[] = [
  { name: "Birdsong", slug: "birdsong", active: true },
  { name: "Bluebells", slug: "bluebells", active: true },
  { name: "Daffodills", slug: "daffodills", active: true },
  { name: "Foals", slug: "foals", active: true },
  { name: "Baby Lambs", slug: "baby_lambs", active: true },
  { name: "Seasonal Flowers", slug: "seasonal_flowers", active: true },
  { name: "Returning swallows, swifts (birds)", slug: "returning_swallows_swifts_birds", active: true },
  { name: "New Ponies", slug: "new_ponies", active: true },
  { name: "Wildflower Meadows", slug: "wildflower_meadows", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Butterflies", slug: "butterflies", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Seabird Colonies", slug: "seabird_colonies", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "PYO Flowers", slug: "pyo_flowers", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "PYO Fruit", slug: "pyo_fruit", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "PYO Vegetables", slug: "pyo_vegetables", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Maize Maze", slug: "maize_maze", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Kingfisher Spotting", slug: "kingfisher_spotting", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "River wildlife spotting", slug: "river_wildlife_spotting", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Glow worms", slug: "glow_worms", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Wildflowers", slug: "wildflowers", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Marine Wildlife Spotting", slug: "marine_wildlife_spotting", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Seasonal Flowers", slug: "seasonal_flowers_seasonal_highlights", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Seasonal water fun", slug: "seasonal_water_fun", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Watersports Hire", slug: "watersports_hire", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Ice Creams", slug: "ice_creams", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Garden games", slug: "garden_games", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Marine Life", slug: "marine_life", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Fruit Picking", slug: "fruit_picking", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Dragonflies & Damselflies", slug: "dragonflies_damselflies", relatedEnumNameSlugs: ["summer"], active: true },
  { name: "Autumn pony \"drifts\"", slug: "autumn_pony_drifts", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Truffling Pigs", slug: "truffling_pigs", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Red Deer Ruts", slug: "red_deer_ruts", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Fungi", slug: "fungi", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Pumpkin Patch", slug: "pumpkin_patch", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Apple Picking", slug: "apple_picking", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Blackberry Picking", slug: "blackberry_picking", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Autumnal Drinks", slug: "autumnal_drinks", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Migrating Birds", slug: "migrating_birds", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Autumn Leaves", slug: "autumn_leaves", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Berries, Nuts, Conkers", slug: "berries_nuts_conkers", relatedEnumNameSlugs: ["autumn"], active: true },
  { name: "Snowdrops", slug: "snowdrops", relatedEnumNameSlugs: ["winter"], active: true },
  { name: "Crocus Lawn", slug: "crocus_lawn", relatedEnumNameSlugs: ["winter"], active: true },
  { name: "Migrating Birds", slug: "migrating_birds_seasonal_highlights", relatedEnumNameSlugs: ["winter"], active: true },
  { name: "Starling Murmurations", slug: "starling_murmurations", relatedEnumNameSlugs: ["winter"], active: true },
  { name: "Seasonal Flowers", slug: "seasonal_flowers_43", relatedEnumNameSlugs: ["winter"], active: true },
  { name: "Festive Displays", slug: "festive_displays", relatedEnumNameSlugs: ["winter"], active: true },
  { name: "Barn Owl Spotting", slug: "barn_owl_spotting", relatedEnumNameSlugs: ["winter"], active: true },
  { name: "Sledging Spot", slug: "sledging_spot", relatedEnumNameSlugs: ["winter"], active: true },
];

export type SeasonalHighlightSlug = (typeof SEASONAL_HIGHLIGHT_ENUM)[number]["slug"];
