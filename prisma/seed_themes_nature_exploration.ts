/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  seedCategoryThemes,
  type CategoryThemeRow,
  type VariantRow,
} from "./lib/seed-category-themes.js";

const NATURE_THEMES: CategoryThemeRow[] = [
  { slug: "scenic_walks", name: "Scenic Walks & Trails" },
  { slug: "green_spaces", name: "Green Open Spaces" },
  { slug: "nature_wildlife", name: "Nature & Wildlife Exploration" },
  { slug: "coastal_adventures", name: "Coastal Adventures" },
  { slug: "gardens_outdoor", name: "Gardens & Curated Outdoor Spaces" },
  { slug: "water_fun", name: "Water Activities" },
];

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  scenic_walks: [
    { slug: "woodland_walk", name: "Woodland Walk" },
    { slug: "coastal_walk", name: "Coastal & Clifftop Walk" },
    { slug: "riverside_walk", name: "River or Lakeside Ramble" },
    { slug: "nature_trail", name: "Nature Trail" },
    { slug: "feature_walk", name: "Feature Walk" },
    { slug: "gentle_wander", name: "Local Wander" },
    { slug: "hilly_hike", name: "Challenging Hike" },
    { slug: "city_circuit", name: "City Circuit" },
    { slug: "towpaths", name: "Towpath" },
  ],
  green_spaces: [
    { slug: "country_parks", name: "Country Park" },
    { slug: "open_parkland", name: "Parkland or Meadow" },
    { slug: "village_greens", name: "Village Green" },
    { slug: "village_parks", name: "Village Park" },
    { slug: "urban_green_spaces", name: "Urban Green Space" },
    { slug: "castle_grounds", name: "Castle Grounds" },
    { slug: "estate_grounds", name: "Estate Grounds" },
  ],
  nature_wildlife: [
    { slug: "nature_reserves", name: "Nature Reserve" },
    { slug: "wildlife_spotting", name: "Wildlife Hotspot" },
    { slug: "hydes_cabins", name: "Hydes or Cabins" },
    { slug: "forest_school", name: "Forest School" },
    { slug: "natural_play_areas", name: "Natural Play Area" },
    { slug: "den_building", name: "Den-Building & Nature Craft" },
    { slug: "nature_trails", name: "Discovery Trail" },
  ],
  coastal_adventures: [
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
  ],
  gardens_outdoor: [
    { slug: "botanical_gardens", name: "Botanical Garden" },
    { slug: "arboretum", name: "Arboretum" },
    { slug: "historic_estate_gardens", name: "Historic Estate Garden" },
    { slug: "formal_landscape_gardens", name: "Landscaped Garden" },
    { slug: "community_gardens", name: "Community Garden" },
    { slug: "themed_gardens", name: "Themed Garden" },
    { slug: "enclosed_gardens", name: "Enclosed Garden" },
  ],
  water_fun: [
    { slug: "paddle_spot", name: "Paddle Spot", description: "Paddling, shallow water, splashy play" },
    { slug: "water_play", name: "Water play", description: "Calm, low-risk, sensory water experiences" },
    { slug: "river_beach", name: "River Beach", description: "Calm water, shade, inland feel" },
    { slug: "water_park", name: "Waterparks", description: "Splash parks / fountains" },
    { slug: "water_rides", name: "On The Water" },
    { slug: "water_adventure", name: "Water Adventure", description: "Braver, exploratory water experiences" },
  ],
};

export async function seedNatureExplorationThemes(): Promise<void> {
  await seedCategoryThemes({
    categorySlug: "nature_exploration",
    themes: NATURE_THEMES,
    variantsByTheme: VARIANTS_BY_THEME,
    clearLegacyUnlinked: true,
  });
}

async function main() {
  console.log("Seeding Nature & Exploration themes...");
  await seedNatureExplorationThemes();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
