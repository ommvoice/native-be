import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedOpportunityVenueV2Events } from "./seed_opportunity_venue_v2_events/index.js";

const prisma = new PrismaClient();

await seedOpportunityVenueV2Events(prisma);
await prisma.$disconnect();
