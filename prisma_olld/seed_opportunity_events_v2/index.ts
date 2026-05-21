import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../api/database/database.config.js";
import { TABLES } from "../../api/database/tables.js";
import { createOpportunityEventV2Row } from "./create_opportunity_event_v2_row.js";
import { opportunityEventV2SeedRows } from "./data.js";

export type { OpportunityEventV2SeedInput } from "./create_opportunity_event_v2_row.js";
export { createOpportunityEventV2Row } from "./create_opportunity_event_v2_row.js";
export { opportunityEventV2SeedRows } from "./data.js";

async function clearTable() {
  let lastKey: Record<string, unknown> | undefined;
  const ids: string[] = [];
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: TABLES.opportunityEventsV2,
        ProjectionExpression: "id",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) ids.push(item.id as string);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  for (const id of ids) {
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityEventsV2, Key: { id } }));
  }
}

export async function seedOpportunityEventsV2() {
  const rows = opportunityEventV2SeedRows();
  await clearTable();

  for (const row of rows) {
    await createOpportunityEventV2Row(row);
  }

  console.log(
    `Seeded ${rows.length} opportunity_events_v2 row(s).`,
  );
}
