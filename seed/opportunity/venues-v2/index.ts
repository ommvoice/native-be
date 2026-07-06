import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../config/index.js";
import { TABLES } from "../../config/index.js";
import { createOpportunityVenueV2Seed } from "./create_opportunity_venue_v2.js";
import type { OpportunityVenueV2SeedInput } from "./create_opportunity_venue_v2.js";

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

export async function seedOpportunityVenuesV2(items: OpportunityVenueV2SeedInput[]) {
  await clearTable();

  for (const item of items) {
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
