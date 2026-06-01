/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { replaceVariantsForTheme, type VariantRow } from "./lib/seed-category-themes.js";

const NATURE_WILDLIFE_VARIANTS: VariantRow[] = [
  { slug: "nature_reserves", name: "Nature Reserve" },
  { slug: "wildlife_spotting", name: "Wildlife Hotspot" },
  { slug: "hydes_cabins", name: "Hydes or Cabins" },
  { slug: "forest_school", name: "Forest School" },
  { slug: "natural_play_areas", name: "Natural Play Area" },
  { slug: "den_building", name: "Den-Building & Nature Craft" },
  { slug: "nature_trails", name: "Discovery Trail" },
];

export async function seedNatureWildlifeVariants(): Promise<void> {
  await replaceVariantsForTheme({
    categorySlug: "nature_exploration",
    themeSlug: "nature_wildlife",
    variants: NATURE_WILDLIFE_VARIANTS,
  });
}

async function main() {
  console.log("Seeding Nature & Wildlife Exploration variants...");
  await seedNatureWildlifeVariants();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
