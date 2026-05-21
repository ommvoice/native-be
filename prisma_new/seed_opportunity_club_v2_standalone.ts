import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedOpportunityClubV2 } from "./seed_opportunity_club_v2/index.js";

const prisma = new PrismaClient();

await seedOpportunityClubV2(prisma);
const count = await prisma.opportunityClubV2.count();
console.log(`Seeded ${count} opportunity clubs (v2).`);
await prisma.$disconnect();
