import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../api/database/database.config.js";
import { TABLES } from "../../api/database/tables.js";
import { createOpportunityVenueV2Seed } from "./create_opportunity_venue_v2.js";
import { opportunityVenuesV2SeedItems } from "./items/index.js";

export type { OpportunityVenueV2SeedInput } from "./create_opportunity_venue_v2.js";
export { createOpportunityVenueV2Seed } from "./create_opportunity_venue_v2.js";

async function clearTable() {
  let lastKey: Record<string, unknown> | undefined;
  const ids: string[] = [];
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: TABLES.opportunityVenuesV2,
        ProjectionExpression: "id",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) ids.push(item.id as string);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  for (const id of ids) {
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityVenuesV2, Key: { id } }));
  }
}

export async function seedOpportunityVenuesV2() {
  await clearTable();

  for (const item of opportunityVenuesV2SeedItems) {
    try {
      await createOpportunityVenueV2Seed(item);
    } catch (err) {
      console.warn(
        `Skipping opportunity venues v2 seed "${item.venueName}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
