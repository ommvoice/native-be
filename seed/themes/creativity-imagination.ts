/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  seedCategoryThemes,
  type CategoryThemeRow,
  type VariantRow,
} from "../lib/seed-category-themes.js";

const THEMES: CategoryThemeRow[] = [
  { slug: "creative_play", name: "Creative Activities" },
  { slug: "imaginative_play", name: "Imaginative & Role Play" },
  { slug: "interactive_museums", name: "Museums & Discovery" },
  { slug: "indoor_entertainment", name: "Indoor Entertainment" },
  { slug: "historical_cultural", name: "History & Culture" },
];

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  creative_play: [
    { slug: "making_and_creating", name: "Creative Artwork", description: "Hands-on creative output: art, craft, clay, textiles" },
    { slug: "expressive_movement_and_music", name: "Music & Movement", description: "Singing, dancing, rhythm, performance" },
    { slug: "creative_expression", name: "Creative Expression", description: "Creative writing, poetry, spoken verse, storytelling" },
    { slug: "performing_and_putting_on_a_show", name: "Performative Arts", description: "Drama, theatre-style play" },
    { slug: "film_photography", name: "Film or Media", description: "Photography, film, creative documentation" },
  ],
  imaginative_play: [
    { slug: "role_play_and_characters", name: "Character-Led Play", description: "Dressing up through to character-led re-enactment" },
    { slug: "immersive_worlds", name: "Immersive Worlds", description: "Depth and escapism" },
    { slug: "scenario_and_world_play", name: "Scenario & World play", description: "Small-world play and complex scenario building" },
    { slug: "narrative_led_experiences", name: "Narrative-led experiences", description: "Story-driven experiences" },
  ],
  interactive_museums: [
    { slug: "science_and_discovery", name: "Science & Discovery", description: "Science centres, discovery museums" },
    { slug: "technology_and_innovation", name: "Technology & Innovation", description: "Tech, engineering, innovation spaces" },
    { slug: "history_made_interactive", name: "History & Pastimes", description: "History presented interactively" },
    { slug: "world_and_cultures", name: "World & Cultures", description: "Geography, people, global cultures" },
    { slug: "children_focused_discovery", name: "Child-Focused Discovery", description: "Designed specifically for children" },
  ],
  indoor_entertainment: [
    { slug: "cinema", name: "Cinema" },
    { slug: "theatre_panto", name: "Stage-Show" },
    { slug: "live_events", name: "Live Events" },
    { slug: "gaming", name: "Gaming & VR" },
    { slug: "comedy_club", name: "Improvised Performance" },
    { slug: "bowling_alley", name: "Bowling" },
  ],
  historical_cultural: [
    { slug: "ancient_sites", name: "Ancient Site", description: "Castles, fortresses, ruins" },
    { slug: "historic_houses", name: "Historic Estate", description: "Manor houses, estates, heritage homes" },
    { slug: "living_history", name: "Living History", description: "Re-enactment, costumed history" },
    { slug: "open_museum", name: "Open-Air Museum" },
    { slug: "industrial_history", name: "Industrial & Working History", description: "Mills, railways, mines, docks" },
    { slug: "archaeological_sites", name: "Archaeological", description: "Fossil spots, archaeological sites of interest" },
    { slug: "cultural_heritage", name: "Cultural Heritage Site", description: "Cultural exhibitions, heritage centres" },
    { slug: "historic_religious", name: "Historic Religious Building", description: "Cathedrals, abbeys, historic churches" },
  ],
};

export async function seedCreativityImaginationThemes(): Promise<void> {
  await seedCategoryThemes({
    categorySlug: "creativity_imagination",
    themes: THEMES,
    variantsByTheme: VARIANTS_BY_THEME,
  });
}

async function main() {
  console.log("Seeding Creativity & Imagination themes...");
  await seedCreativityImaginationThemes();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
