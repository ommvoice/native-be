import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedOpportunityRouteV2 } from "./seed_opportunity_route_v2/index.js";

const prisma = new PrismaClient();

await seedOpportunityRouteV2(prisma);
const count = await prisma.opportunityRouteV2.count();
console.log(`Seeded ${count} opportunity routes (v2).`);
await prisma.$disconnect();
