import type { PrismaClient } from "@prisma/client";
import { createOpportunityClubV2Row } from "./create_opportunity_club_v2_row.js";
import { opportunityClubV2SeedRows } from "./data.js";

export type { OpportunityClubV2SeedInput } from "./create_opportunity_club_v2_row.js";
export { createOpportunityClubV2Row } from "./create_opportunity_club_v2_row.js";

export async function seedOpportunityClubV2(prisma: PrismaClient) {
  await prisma.opportunityClubV2.deleteMany();
  for (const row of opportunityClubV2SeedRows) {
    await createOpportunityClubV2Row(prisma, row);
  }
}
