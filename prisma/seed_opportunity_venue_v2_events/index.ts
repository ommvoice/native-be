import type { PrismaClient } from "@prisma/client";
import { createOpportunityVenueV2EventRow } from "./create_opportunity_venue_v2_event_row.js";
import { opportunityVenueV2EventSeedRows } from "./data.js";

export type { OpportunityVenueV2EventSeedInput } from "./create_opportunity_venue_v2_event_row.js";
export { createOpportunityVenueV2EventRow } from "./create_opportunity_venue_v2_event_row.js";
export { opportunityVenueV2EventSeedRows } from "./data.js";

export async function seedOpportunityVenueV2Events(prisma: PrismaClient) {
  const rows = opportunityVenueV2EventSeedRows();
  await prisma.opportunityVenueV2.deleteMany();

  for (const row of rows) {
    await createOpportunityVenueV2EventRow(prisma, row);
  }

  console.log(
    `Seeded ${rows.length} opportunity_venue_v2 (event import) row(s). If theme lookups failed, run \`npm run seed:opportunity-themes\` first.`,
  );
}
