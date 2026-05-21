import { ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../api/database/database.config.js";
import { TABLES } from "../../api/database/tables.js";
import { createOpportunityClubV2Row } from "./create_opportunity_club_v2_row.js";
import { opportunityClubV2SeedRows } from "./data.js";

export type { OpportunityClubV2SeedInput } from "./create_opportunity_club_v2_row.js";
export { createOpportunityClubV2Row } from "./create_opportunity_club_v2_row.js";

async function clearTable() {
  let lastKey: Record<string, unknown> | undefined;
  const ids: string[] = [];
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: TABLES.opportunityClubsV2,
        ProjectionExpression: "id",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) ids.push(item.id as string);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  for (const id of ids) {
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityClubsV2, Key: { id } }));
  }
}

export async function seedOpportunityClubV2() {
  await clearTable();
  for (const row of opportunityClubV2SeedRows) {
    await createOpportunityClubV2Row(row);
  }
}
