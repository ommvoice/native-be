/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { replaceVariantsForTheme, type VariantRow } from "./lib/seed-category-themes.js";

const GREEN_SPACES_VARIANTS: VariantRow[] = [
  { slug: "country_parks", name: "Country Park" },
  { slug: "open_parkland", name: "Parkland or Meadow" },
  { slug: "village_greens", name: "Village Green" },
  { slug: "village_parks", name: "Village Park" },
  { slug: "urban_green_spaces", name: "Urban Green Space" },
  { slug: "castle_grounds", name: "Castle Grounds" },
  { slug: "estate_grounds", name: "Estate Grounds" },
];

export async function seedGreenSpacesVariants(): Promise<void> {
  await replaceVariantsForTheme({
    categorySlug: "nature_exploration",
    themeSlug: "green_spaces",
    variants: GREEN_SPACES_VARIANTS,
  });
}

async function main() {
  console.log("Seeding Green Open Spaces variants...");
  await seedGreenSpacesVariants();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
