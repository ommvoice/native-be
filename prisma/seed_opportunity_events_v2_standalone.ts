import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedOpportunityEventsV2 } from "./seed_opportunity_events_v2/index.js";

const prisma = new PrismaClient();

await seedOpportunityEventsV2(prisma);
await prisma.$disconnect();
