/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  seedCategoryThemes,
  type CategoryThemeRow,
  type VariantRow,
} from "./lib/seed-category-themes.js";

const THEMES: CategoryThemeRow[] = [
  { slug: "hands_on_learning", name: "Hands-On Learning" },
  { slug: "interactive_museums", name: "Museums & Discovery" },
  { slug: "historical_cultural", name: "History & Culture" },
  { slug: "animal_encounters", name: "Animal Encounters" },
  { slug: "vehicles_transport", name: "Transport & Engineering" },
];

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  hands_on_learning: [
    { slug: "experiments", name: "Experiments", description: "Science-style exploration, trial & error" },
    { slug: "discovery_challenges", name: "Discovery-Based Challenges" },
    { slug: "learning_through_play", name: "Learning Through Play", description: "Play-led learning environments" },
    { slug: "interactive_exhibits", name: "Interactive Exhibits", description: "Touch, build, manipulate" },
    { slug: "problem_solving", name: "Problem-Solving", description: "Puzzles, logic, engineering-style tasks" },
    { slug: "construction_activity", name: "Construction Activities", description: "Constructing, assembling, creating" },
  ],
  interactive_museums: [
    { slug: "science_and_discovery", name: "Science & Discovery", description: "Science centres, discovery museums" },
    { slug: "technology_and_innovation", name: "Technology & Innovation", description: "Tech, engineering, innovation spaces" },
    { slug: "history_made_interactive", name: "History & Pastimes", description: "History presented interactively" },
    { slug: "world_and_cultures", name: "World & Cultures", description: "Geography, people, global cultures" },
    { slug: "children_focused_discovery", name: "Child-Focused Discovery", description: "Designed specifically for children" },
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
  animal_encounters: [
    { slug: "farm_and_smallholding", name: "Farm or Smallholding", description: "Petting farms, open farms, smallholdings" },
    { slug: "wildlife_reserve", name: "Wildlife Reserve" },
    { slug: "animal_parks", name: "Animal Parks & Zoos", description: "Zoos, safari parks, wildlife parks" },
    { slug: "conservation_project", name: "Conservation Project", isActive: true },
    { slug: "animal_sanctuary", name: "Animal Sanctuary" },
    { slug: "sealife_aquarium", name: "Marine Aquarium", description: "Aquatic animal centres" },
    { slug: "reptiles_and_exotics", name: "Reptiles & Exotics", description: "Reptile centres, specialist collections" },
    { slug: "birds_of_prey", name: "Bird of Prey Centre" },
    { slug: "stables_yard", name: "Stables or Yard", description: "Riding, grooming, pony encounters" },
  ],
  vehicles_transport: [
    { slug: "trains_and_rail", name: "Trains & Railways", description: "Steam, heritage, miniature railways" },
    { slug: "boat_trips", name: "Boat Trips & Ferries", description: "Ferries, sightseeing boat trips" },
    { slug: "harbours_and_marinas", name: "Harbours & Marinas", description: "Watching boats, ports, docks" },
    { slug: "aviation_experiences", name: "Aircraft & Aviation", description: "Museums, viewing areas, airfields" },
    { slug: "transport_museums", name: "Transport Museum", description: "Cars, buses, mixed vehicle collections" },
    { slug: "working_transport_hubs", name: "Working Transport Hubs", description: "Stations, depots, logistics hubs" },
  ],
};

export async function seedLearningCuriosityThemes(): Promise<void> {
  await seedCategoryThemes({
    categorySlug: "learning_curiosity",
    themes: THEMES,
    variantsByTheme: VARIANTS_BY_THEME,
  });
}

async function main() {
  console.log("Seeding Learning & Curiosity themes...");
  await seedLearningCuriosityThemes();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
