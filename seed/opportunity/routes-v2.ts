import "dotenv/config";
import { seedOpportunityRouteV2 } from "./routes-v2/index.js";

await seedOpportunityRouteV2();
console.log("Seeded opportunity routes (v2).");
