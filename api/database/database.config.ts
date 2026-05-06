import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Cleanly release connections on process exit (important for Aurora failover)
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully.");
  } catch (error) {
    console.error("❌ Failed to connect to DB:", error);
    throw error;
  }
};

export default prisma;
