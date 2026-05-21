import "dotenv/config";
import { seedOpportunityClubV2 } from "./seed_opportunity_club_v2/index.js";

await seedOpportunityClubV2();
console.log("Seeded opportunity clubs (v2).");
