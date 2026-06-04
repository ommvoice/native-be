/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { replaceVariantsForTheme, type VariantRow } from "../lib/seed-category-themes.js";

const COASTAL_ADVENTURES_VARIANTS: VariantRow[] = [
  { slug: "sandy_beach", name: "Sandy Beach" },
  { slug: "pebble_beach", name: "Pebble or Shingle Beach" },
  { slug: "rnli_beach", name: "RNLI Beach" },
  { slug: "coves_exploration", name: "Rocky Cove" },
  { slug: "coasteering_adventure", name: "Coasteering Beach" },
  { slug: "wild_open_beaches", name: "Wild or Remote Beach" },
  { slug: "dog_friendly_beaches", name: "Dog-Friendly Beach" },
  { slug: "mixed_sand_shingle", name: "Mixed Sand & Shingle Beach" },
  { slug: "cove_or_bay", name: "Sheltered Cove or Bay" },
  { slug: "surf_beach", name: "Surf Beach" },
  { slug: "harbour_beach", name: "Harbour or Village Beach" },
  { slug: "estuary_beach", name: "Estuary Beach" },
];

export async function seedCoastalAdventuresVariants(): Promise<void> {
  await replaceVariantsForTheme({
    categorySlug: "nature_exploration",
    themeSlug: "coastal_adventures",
    variants: COASTAL_ADVENTURES_VARIANTS,
  });
}

async function main() {
  console.log("Seeding Coastal Adventures variants...");
  await seedCoastalAdventuresVariants();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
