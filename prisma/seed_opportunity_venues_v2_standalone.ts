import "dotenv/config";
import { seedOpportunityVenuesV2 } from "./seed_opportunity_venues_v2/index.js";

await seedOpportunityVenuesV2();
console.log("Seeded opportunity venues (v2).");
