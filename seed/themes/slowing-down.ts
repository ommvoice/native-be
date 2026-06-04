/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  seedCategoryThemes,
  type CategoryThemeRow,
  type VariantRow,
} from "../lib/seed-category-themes.js";

const THEMES: CategoryThemeRow[] = [
  { slug: "sensory_soothing", name: "Sensory or Calming Experiences" },
  { slug: "relaxed_cafe", name: "Cafés & Coffee Stops" },
];

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  sensory_soothing: [
    { slug: "sensory_garden", name: "Sensory garden", description: "Outdoor, designed-for-senses, calming by intent" },
    { slug: "sensory_room_or_space", name: "Sensory Space", description: "Dedicated indoor sensory rooms or calming spaces" },
    { slug: "calming_designed_environment", name: "Soothing Environment", description: "Intentionally gentle environments or installations" },
    { slug: "light_touch_sensory_experience", name: "Light-touch Sensory", description: "Sensory-focused but not intense or overwhelming" },
  ],
  relaxed_cafe: [
    { slug: "family_friendly_cafes", name: "Family-Friendly Cafés", description: "Welcoming, space for kids" },
    { slug: "cafe_with_play", name: "Quiet Cafés", description: "Toys, books, colouring" },
    { slug: "cafe_with_outdoor_space", name: "Cafés with Outdoor Space", description: "Gardens, courtyards, terraces" },
    { slug: "coffee_cabin", name: "Coffee Cabin / Truck", description: "Small mobile coffee stations with nearby seating / views" },
    { slug: "pit_stop_cafes", name: "Easy Pit-Stops", description: "On routes, parks, attractions" },
  ],
};

export async function seedSlowingDownThemes(): Promise<void> {
  await seedCategoryThemes({
    categorySlug: "slowing_down",
    themes: THEMES,
    variantsByTheme: VARIANTS_BY_THEME,
  });
}

async function main() {
  console.log("Seeding Slowing Down themes...");
  await seedSlowingDownThemes();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
