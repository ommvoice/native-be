/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { replaceVariantsForTheme, type VariantRow } from "../lib/seed-category-themes.js";

const ACTIVE_PLAY_CLIMBING_VARIANTS: VariantRow[] = [
  { slug: "large_playgrounds", name: "Destination Playground" },
  { slug: "local_playgrounds", name: "Local park" },
  { slug: "adventure_playgrounds", name: "Adventure Playground" },
  { slug: "natural_play", name: "Natural Obstacle Course" },
  { slug: "skate_park", name: "Skate Park" },
  { slug: "orienteering_course", name: "Orienteering Course" },
  { slug: "letterboxing_course", name: "Letterboxing Site" },
];

export async function seedActivePlayClimbingVariants(): Promise<void> {
  await replaceVariantsForTheme({
    categorySlug: "movement_energy",
    themeSlug: "active_play_climbing",
    variants: ACTIVE_PLAY_CLIMBING_VARIANTS,
  });
}

async function main() {
  console.log("Seeding Playgrounds & Adventure Parks variants...");
  await seedActivePlayClimbingVariants();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
