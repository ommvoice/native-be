/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { replaceVariantsForTheme, type VariantRow } from "../lib/seed-category-themes.js";

const GARDENS_OUTDOOR_VARIANTS: VariantRow[] = [
  { slug: "botanical_gardens", name: "Botanical Garden" },
  { slug: "arboretum", name: "Arboretum" },
  { slug: "historic_estate_gardens", name: "Historic Estate Garden" },
  { slug: "formal_landscape_gardens", name: "Landscaped Garden" },
  { slug: "community_gardens", name: "Community Garden" },
  { slug: "themed_gardens", name: "Themed Garden" },
  { slug: "enclosed_gardens", name: "Enclosed Garden" },
];

export async function seedGardensOutdoorVariants(): Promise<void> {
  await replaceVariantsForTheme({
    categorySlug: "nature_exploration",
    themeSlug: "gardens_outdoor",
    variants: GARDENS_OUTDOOR_VARIANTS,
  });
}

async function main() {
  console.log("Seeding Gardens & Curated Outdoor Spaces variants...");
  await seedGardensOutdoorVariants();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
