/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import {
  seedCategoryThemes,
  type CategoryThemeRow,
  type VariantRow,
} from "./lib/seed-category-themes.js";

const MOVEMENT_THEMES: CategoryThemeRow[] = [
  { slug: "active_play_climbing", name: "Playgrounds & Adventure Parks" },
  { slug: "sporty_activities", name: "Sporty Activities" },
  { slug: "wheels_routes", name: "Rideable Routes" },
  { slug: "soft_play", name: "Soft Play & Indoor Active Play" },
  { slug: "water_fun", name: "Water Activities" },
  { slug: "hands_on_learning", name: "Hands-On Learning" },
];

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  active_play_climbing: [
    { slug: "large_playgrounds", name: "Destination Playground" },
    { slug: "local_playgrounds", name: "Local park" },
    { slug: "adventure_playgrounds", name: "Adventure Playground" },
    { slug: "natural_play", name: "Natural Obstacle Course" },
    { slug: "skate_park", name: "Skate Park" },
    { slug: "orienteering_course", name: "Orienteering Course" },
    { slug: "letterboxing_course", name: "Letterboxing Site" },
  ],
  sporty_activities: [
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
  ],
  wheels_routes: [
    { slug: "quick_spin", name: "Quick spin", description: "Easy win / quick reset energy" },
    { slug: "longer_ride", name: "Longer ride", description: "A more committed outing" },
    { slug: "practise_route", name: "Practise Space", description: "Learning, improving, settling nerves" },
    { slug: "skills_and_stunts", name: "Skills & Stunts Space", description: "Pump tracks, ramps, jumps" },
  ],
  soft_play: [
    { slug: "large_soft_play", name: "Soft Play Centre", description: "Multi-level, slides, big structures" },
    { slug: "toddler_soft_play", name: "Toddler Play Space", description: "Designed for under 5s" },
    { slug: "indoor_climbing", name: "Indoor Climbing", description: "Climbing walls, obstacle-style energy" },
    { slug: "indoor_course", name: "Inside Course", description: "Assault course, ninja course, obstacles" },
    { slug: "trampoline_park", name: "Trampoline Park", description: "Trampolines, bounce parks" },
    { slug: "indoor_multi_activity", name: "Multi-Activity Centre", description: "Mixed zones: soft play + trampolines etc" },
  ],
  water_fun: [
    { slug: "paddle_spot", name: "Paddle Spot", description: "Paddling, shallow water, splashy play" },
    { slug: "water_play", name: "Water play", description: "Calm, low-risk, sensory water experiences" },
    { slug: "river_beach", name: "River Beach", description: "Calm water, shade, inland feel" },
    { slug: "water_park", name: "Waterparks", description: "Splash parks / fountains" },
    { slug: "water_rides", name: "On The Water" },
    { slug: "water_adventure", name: "Water Adventure", description: "Braver, exploratory water experiences" },
  ],
  hands_on_learning: [
    { slug: "experiments", name: "Experiments", description: "Science-style exploration, trial & error" },
    { slug: "discovery_challenges", name: "Discovery-Based Challenges" },
    { slug: "learning_through_play", name: "Learning Through Play", description: "Play-led learning environments" },
    { slug: "interactive_exhibits", name: "Interactive Exhibits", description: "Touch, build, manipulate" },
    { slug: "problem_solving", name: "Problem-Solving", description: "Puzzles, logic, engineering-style tasks" },
    { slug: "construction_activity", name: "Construction Activities", description: "Constructing, assembling, creating" },
  ],
};

export async function seedMovementEnergyThemes(): Promise<void> {
  await seedCategoryThemes({
    categorySlug: "movement_energy",
    themes: MOVEMENT_THEMES,
    variantsByTheme: VARIANTS_BY_THEME,
  });
}

async function main() {
  console.log("Seeding Movement & Energy themes...");
  await seedMovementEnergyThemes();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
