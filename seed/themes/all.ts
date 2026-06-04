/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { clearAllThemeVariants } from "../lib/seed-category-themes.js";
import { seedNatureExplorationThemes }    from "./nature-exploration.js";
import { seedMovementEnergyThemes }       from "./movement-energy.js";
import { seedCreativityImaginationThemes } from "./creativity-imagination.js";
import { seedLearningCuriosityThemes }    from "./learning-curiosity.js";
import { seedSlowingDownThemes }          from "./slowing-down.js";
import { seedTogetherTimeThemes }         from "./together-time.js";
import { seedSpecialMemorableThemes }     from "./special-memorable.js";

export async function seedAllCategoryThemes(): Promise<void> {
  const removed = await clearAllThemeVariants();
  console.log(`  Cleared ${removed} theme variant row(s).\n`);

  await seedNatureExplorationThemes();
  await seedMovementEnergyThemes();
  await seedCreativityImaginationThemes();
  await seedLearningCuriosityThemes();
  await seedSlowingDownThemes();
  await seedTogetherTimeThemes();
  await seedSpecialMemorableThemes();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Seeding all interest category themes...\n");
  seedAllCategoryThemes()
    .then(() => console.log("\nAll themes seeded."))
    .catch((e) => { console.error(e); process.exit(1); });
}
