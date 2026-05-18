import type { PrismaClient } from "@prisma/client";
import { createOpportunityEventV2Row } from "./create_opportunity_event_v2_row.js";
import { opportunityEventV2SeedRows } from "./data.js";

export type { OpportunityEventV2SeedInput } from "./create_opportunity_event_v2_row.js";
export { createOpportunityEventV2Row } from "./create_opportunity_event_v2_row.js";
export { opportunityEventV2SeedRows } from "./data.js";

export async function seedOpportunityEventsV2(prisma: PrismaClient) {
  const rows = opportunityEventV2SeedRows();
  await prisma.opportunityEventsV2.deleteMany();

  for (const row of rows) {
    await createOpportunityEventV2Row(prisma, row);
  }

  console.log(
    `Seeded ${rows.length} opportunity_events_v2 row(s). If theme lookups failed, run \`npm run seed:opportunity-themes\` first.`,
  );
}
