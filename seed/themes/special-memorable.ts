/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  seedCategoryThemes,
  type CategoryThemeRow,
  type VariantRow,
} from "../lib/seed-category-themes.js";

const THEMES: CategoryThemeRow[] = [
  { slug: "a_big_day_out", name: "A Big Day Out" },
  { slug: "indoor_entertainment", name: "Indoor Entertainment" },
];

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  a_big_day_out: [
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
};

export async function seedSpecialMemorableThemes(): Promise<void> {
  await seedCategoryThemes({
    categorySlug: "special_memorable",
    themes: THEMES,
    variantsByTheme: VARIANTS_BY_THEME,
  });
}

async function main() {
  console.log("Seeding Special & Memorable Days Out themes...");
  await seedSpecialMemorableThemes();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
