import "dotenv/config";
import { seedOpportunityRouteV2 } from "./seed_opportunity_route_v2/index.js";

await seedOpportunityRouteV2();
console.log("Seeded opportunity routes (v2).");
