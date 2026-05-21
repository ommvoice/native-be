import type { PrismaClient } from "@prisma/client";
import { createOpportunityVenueV2Seed } from "./create_opportunity_venue_v2.js";
import { opportunityVenuesV2SeedItems } from "./items/index.js";

export type { OpportunityVenueV2SeedInput } from "./create_opportunity_venue_v2.js";
export { createOpportunityVenueV2Seed } from "./create_opportunity_venue_v2.js";

export async function seedOpportunityVenuesV2(prisma: PrismaClient) {
  await prisma.opportunityVenuesV2.deleteMany();

  for (const item of opportunityVenuesV2SeedItems) {
    try {
      await createOpportunityVenueV2Seed(prisma, item);
    } catch (err) {
      console.warn(
        `Skipping opportunity venues v2 seed "${item.venueName}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
