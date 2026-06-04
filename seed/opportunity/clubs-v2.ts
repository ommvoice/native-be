import "dotenv/config";
import { seedOpportunityClubV2 } from "./clubs-v2/index.js";

await seedOpportunityClubV2();
console.log("Seeded opportunity clubs (v2).");
