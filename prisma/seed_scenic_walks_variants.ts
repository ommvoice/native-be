/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  clearAllThemeVariants,
  replaceVariantsForTheme,
  type VariantRow,
} from "./lib/seed-category-themes.js";

const SCENIC_WALKS_VARIANTS: VariantRow[] = [
  { slug: "woodland_walk", name: "Woodland Walk" },
  { slug: "coastal_walk", name: "Coastal & Clifftop Walk" },
  { slug: "riverside_walk", name: "River or Lakeside Ramble" },
  { slug: "nature_trail", name: "Nature Trail" },
  { slug: "feature_walk", name: "Feature Walk" },
  { slug: "gentle_wander", name: "Local Wander" },
  { slug: "hilly_hike", name: "Challenging Hike" },
  { slug: "city_circuit", name: "City Circuit" },
  { slug: "towpaths", name: "Towpath" },
];

export async function seedScenicWalksVariants(): Promise<void> {
  const removed = await clearAllThemeVariants();
  console.log(`  Cleared ${removed} existing theme variant row(s).`);

  await replaceVariantsForTheme({
    categorySlug: "nature_exploration",
    themeSlug: "scenic_walks",
    variants: SCENIC_WALKS_VARIANTS,
  });
}

async function main() {
  console.log("Re-seeding Scenic Walks & Trails variants...");
  await seedScenicWalksVariants();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
