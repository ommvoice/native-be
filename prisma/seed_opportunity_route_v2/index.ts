import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../api/database/database.config.js";
import { TABLES } from "../../api/database/tables.js";
import { createOpportunityRouteV2Row } from "./create_opportunity_route_v2_row.js";
import { opportunityRouteV2SeedRows } from "./data.js";

export type { OpportunityRouteV2SeedInput } from "./create_opportunity_route_v2_row.js";
export { createOpportunityRouteV2Row } from "./create_opportunity_route_v2_row.js";

async function clearTable() {
  let lastKey: Record<string, unknown> | undefined;
  const ids: string[] = [];
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: TABLES.opportunityRoutesV2,
        ProjectionExpression: "id",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) ids.push(item.id as string);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  for (const id of ids) {
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityRoutesV2, Key: { id } }));
  }
}

export async function seedOpportunityRouteV2() {
  await clearTable();
  for (const row of opportunityRouteV2SeedRows) {
    await createOpportunityRouteV2Row(row);
  }
}
