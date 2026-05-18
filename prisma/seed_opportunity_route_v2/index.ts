import type { PrismaClient } from "@prisma/client";
import { createOpportunityRouteV2Row } from "./create_opportunity_route_v2_row.js";
import { opportunityRouteV2SeedRows } from "./data.js";

export type { OpportunityRouteV2SeedInput } from "./create_opportunity_route_v2_row.js";
export { createOpportunityRouteV2Row } from "./create_opportunity_route_v2_row.js";

export async function seedOpportunityRouteV2(prisma: PrismaClient) {
  await prisma.opportunityRouteV2.deleteMany();
  for (const row of opportunityRouteV2SeedRows) {
    await createOpportunityRouteV2Row(prisma, row);
  }
}
