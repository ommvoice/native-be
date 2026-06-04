/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { seedScenicWalksVariants }       from "./scenic-walks.js";
import { seedGreenSpacesVariants }       from "./green-spaces.js";
import { seedNatureWildlifeVariants }    from "./nature-wildlife.js";
import { seedCoastalAdventuresVariants } from "./coastal-adventures.js";
import { seedGardensOutdoorVariants }    from "./gardens-outdoor.js";
import { seedActivePlayClimbingVariants } from "./active-play-climbing.js";
import { seedSportyActivitiesVariants }  from "./sporty-activities.js";

export async function seedAllVariants(): Promise<void> {
  await seedScenicWalksVariants();
  await seedGreenSpacesVariants();
  await seedNatureWildlifeVariants();
  await seedCoastalAdventuresVariants();
  await seedGardensOutdoorVariants();
  await seedActivePlayClimbingVariants();
  await seedSportyActivitiesVariants();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Seeding all theme variants...\n");
  seedAllVariants()
    .then(() => console.log("\nAll variants seeded."))
    .catch((e) => { console.error(e); process.exit(1); });
}
