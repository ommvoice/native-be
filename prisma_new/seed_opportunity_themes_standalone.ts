import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedOpportunityThemes } from "./seed_opportunity_themes.js";

const prisma = new PrismaClient();

await seedOpportunityThemes(prisma);
await prisma.$disconnect();
