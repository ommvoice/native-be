/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { clearAllThemeVariants } from "./lib/seed-category-themes.js";
import { seedNatureExplorationThemes } from "./seed_themes_nature_exploration.js";
import { seedMovementEnergyThemes } from "./seed_themes_movement_energy.js";
import { seedCreativityImaginationThemes } from "./seed_themes_creativity_imagination.js";
import { seedLearningCuriosityThemes } from "./seed_themes_learning_curiosity.js";
import { seedSlowingDownThemes } from "./seed_themes_slowing_down.js";
import { seedTogetherTimeThemes } from "./seed_themes_together_time.js";
import { seedSpecialMemorableThemes } from "./seed_themes_special_memorable.js";

export async function seedAllCategoryThemes(): Promise<void> {
  const removed = await clearAllThemeVariants();
  console.log(`Cleared ${removed} theme variant row(s).\n`);

  await seedNatureExplorationThemes();
  await seedMovementEnergyThemes();
  await seedCreativityImaginationThemes();
  await seedLearningCuriosityThemes();
  await seedSlowingDownThemes();
  await seedTogetherTimeThemes();
  await seedSpecialMemorableThemes();
}

async function main() {
  console.log("Seeding all interest category themes...\n");
  await seedAllCategoryThemes();
  console.log("\nAll category themes seeded.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
