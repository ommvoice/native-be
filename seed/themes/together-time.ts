/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  seedCategoryThemes,
  type CategoryThemeRow,
  type VariantRow,
} from "../lib/seed-category-themes.js";

const THEMES: CategoryThemeRow[] = [
  { slug: "family_dining", name: "Family Dining" },
  { slug: "big_day_out", name: "A Big Day Out" },
  { slug: "indoor_entertainment", name: "Indoor Entertainment" },
  { slug: "relaxed_cafe", name: "Cafés & Coffee Stops" },
];

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  family_dining: [
    { slug: "casual_family_restaurants", name: "Family Eateries", description: "Relaxed, unfussy, welcoming" },
    { slug: "dining_with_space", name: "Outdoor Family Dining", description: "Gardens, play corners, outdoor areas" },
    { slug: "destination_dining", name: "Destination Family Dining", description: "Food as part of a wider outing" },
    { slug: "food_festival", name: "Food Festivals" },
  ],
  big_day_out: [
    { slug: "themepark", name: "Themepark", description: "Ride-based parks" },
    { slug: "amusement_park", name: "Amusement Park", description: "Arcades" },
    { slug: "major_animal_attractions", name: "Major Animal Attractions", description: "Zoos, safari parks" },
    { slug: "large_scale_outdoor", name: "Large-Scale Outdoor Attractions", description: "Estates, expansive outdoor sites" },
    { slug: "major_indoor", name: "Major Indoor Attractions", description: "Large indoor destinations" },
    { slug: "seasonal_and_themed", name: "Seasonal & Themed Events", description: "Christmas trails, festivals, themed days" },
  ],
  indoor_entertainment: [
    { slug: "cinema", name: "Cinema" },
    { slug: "theatre_panto", name: "Stage-Show" },
    { slug: "live_events", name: "Live Events" },
    { slug: "gaming", name: "Gaming & VR" },
    { slug: "comedy_club", name: "Improvised Performance" },
    { slug: "bowling_alley", name: "Bowling" },
  ],
  relaxed_cafe: [
    { slug: "family_friendly_cafes", name: "Family-Friendly Cafés", description: "Welcoming, space for kids" },
    { slug: "cafe_with_play", name: "Quiet Cafés", description: "Toys, books, colouring" },
    { slug: "cafe_with_outdoor_space", name: "Cafés with Outdoor Space", description: "Gardens, courtyards, terraces" },
    { slug: "coffee_cabin", name: "Coffee Cabin / Truck", description: "Small mobile coffee stations with nearby seating / views" },
    { slug: "pit_stop_cafes", name: "Easy Pit-Stops", description: "On routes, parks, attractions" },
  ],
};

export async function seedTogetherTimeThemes(): Promise<void> {
  await seedCategoryThemes({
    categorySlug: "together_time",
    themes: THEMES,
    variantsByTheme: VARIANTS_BY_THEME,
  });
}

async function main() {
  console.log("Seeding Family Resets themes...");
  await seedTogetherTimeThemes();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
