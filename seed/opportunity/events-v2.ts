import "dotenv/config";
import { seedOpportunityEventsV2 as seedOpportunityEventV2 } from "./events-v2/index.js";

await seedOpportunityEventV2();
console.log("Seeded opportunity events (v2).");
