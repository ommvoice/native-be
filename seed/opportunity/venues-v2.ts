import "dotenv/config";
import { seedOpportunityVenuesV2 as seedOpportunityVenueV2 } from "./venues-v2/index.js";

await seedOpportunityVenueV2();
console.log("Seeded opportunity venues (v2).");
