import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedOpportunityVenuesV2 } from "./seed_opportunity_venues_v2/index.js";

const prisma = new PrismaClient();

await seedOpportunityVenuesV2(prisma);
await prisma.$disconnect();
