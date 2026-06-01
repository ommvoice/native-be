/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { replaceVariantsForTheme, type VariantRow } from "./lib/seed-category-themes.js";

const SPORTY_ACTIVITIES_VARIANTS: VariantRow[] = [
  { slug: "leisure_centre", name: "Leisure Centre" },
  { slug: "climbing_centre", name: "Climbing Centre" },
  { slug: "multisports_activity_centre", name: "Multisports Centre" },
  { slug: "sports_stadium", name: "Sport Stadium" },
  { slug: "sports_arena", name: "Sport Arena" },
  { slug: "swimming_pool", name: "Swimming Pool" },
  { slug: "community_centre", name: "Community Centre" },
  { slug: "range", name: "Range" },
  { slug: "sports_track", name: "Sports Track" },
  { slug: "indoor_courts", name: "Indoor Court" },
  { slug: "outdoor_courts", name: "Outdoor Court" },
  { slug: "specialist_sports_facility", name: "Specialist Facility" },
  { slug: "outdoor_pitch", name: "Outdoor Pitch" },
  { slug: "gym", name: "Gym" },
];

export async function seedSportyActivitiesVariants(): Promise<void> {
  await replaceVariantsForTheme({
    categorySlug: "movement_energy",
    themeSlug: "sporty_activities",
    variants: SPORTY_ACTIVITIES_VARIANTS,
  });
}

async function main() {
  console.log("Seeding Sporty Activities variants...");
  await seedSportyActivitiesVariants();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
