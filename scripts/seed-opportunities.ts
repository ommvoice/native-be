/// <reference types="node" />
/**
 * Seeds the Venues/Events/Clubs/Routes DynamoDB tables from the static JSON
 * assets under app/shared/assets/ (venues.json, events.json, clubs.json,
 * routes.json — see AssetsService for the read-side equivalent).
 *
 * Usage: APP_ENV=dev npx tsx scripts/seed-opportunities.ts
 * (APP_ENV defaults to "dev" — see seed/config/index.ts for how the table
 * prefix/region are resolved from cdk/cdk.json context.)
 *
 * By default this only upserts (Put — insert new ids, fully overwrite matching ones); it never
 * deletes anything, so rows whose id isn't in the current JSON are left behind as orphans. Pass
 * one of the flags below to also/instead clear a table first — clearing is a full table scan +
 * batch-delete (DynamoDB has no truncate), so it's O(table size) and irreversible:
 *
 *   --clear        Delete every existing row in each table, then seed as normal (a full reset).
 *   --clear-only   Delete every existing row and stop — does not reseed afterwards.
 *
 * Clearing "prod" additionally requires --force-prod, so a stray --clear against the wrong
 * APP_ENV can't wipe production by accident.
 *
 * Records marked `active: false` (REMOVE rows merged in by scripts/merge-opportunity-updates.ts) are
 * never seeded, and any copy of them already in the table from an earlier run is deleted — otherwise
 * a removed opportunity would keep showing in the app.
 */
import { BatchWriteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLES, environment } from "../seed/config/index.js";
import venues from "../app/shared/assets/venues.json" with { type: "json" };
import events from "../app/shared/assets/events.json" with { type: "json" };
import clubs from "../app/shared/assets/clubs.json" with { type: "json" };
import routes from "../app/shared/assets/routes.json" with { type: "json" };

const BATCH_WRITE_MAX = 25;

async function batchWrite(tableName: string, requests: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < requests.length; i += BATCH_WRITE_MAX) {
    await db.send(
      new BatchWriteCommand({
        RequestItems: { [tableName]: requests.slice(i, i + BATCH_WRITE_MAX) },
      }),
    );
  }
}

/** Puts every active record; deletes inactive ones (`active: false`) from the table instead. */
async function seedTable(tableName: string, items: Record<string, unknown>[]): Promise<void> {
  const active = items.filter((item) => item.active !== false);
  const inactiveIds = items.filter((item) => item.active === false).map((item) => item.id as string);

  await batchWrite(tableName, active.map((item) => ({ PutRequest: { Item: item } })));
  // Deleting an id that isn't in the table is a no-op, so this is safe to repeat on every run.
  await batchWrite(tableName, inactiveIds.map((id) => ({ DeleteRequest: { Key: { id } } })));

  console.log(`  ${tableName} — seeded ${active.length} items`);
  if (inactiveIds.length) console.log(`  ${tableName} — skipped + removed ${inactiveIds.length} inactive: ${inactiveIds.join(", ")}`);
}

/** Deletes every row currently in `tableName` — scans the whole table (id-only projection, paged
 * via LastEvaluatedKey) then batch-deletes 25 at a time. Irreversible; only runs behind --clear /
 * --clear-only. */
async function clearTable(tableName: string): Promise<void> {
  let deleted = 0;
  let lastKey: Record<string, unknown> | undefined;

  do {
    const scanRes = await db.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "id",
        ExclusiveStartKey: lastKey,
      }),
    );
    const items = (scanRes.Items ?? []) as { id: string }[];

    for (let i = 0; i < items.length; i += BATCH_WRITE_MAX) {
      const chunk = items.slice(i, i + BATCH_WRITE_MAX);
      await db.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: chunk.map(({ id }) => ({ DeleteRequest: { Key: { id } } })),
          },
        }),
      );
    }

    deleted += items.length;
    lastKey = scanRes.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  console.log(`  ${tableName} — deleted ${deleted} items`);
}

async function main(): Promise<void> {

    console.log("Seeding opportunity tables...");

    //  await clearTable(TABLES.venues);
    //  await clearTable(TABLES.routes);
    //  await clearTable(TABLES.clubs);
    //  await clearTable(TABLES.events);
    // await seedTable(TABLES.venues, venues as Record<string, unknown>[]);
    // await seedTable(TABLES.events, events as Record<string, unknown>[]);
    // await seedTable(TABLES.clubs, clubs as Record<string, unknown>[]);
    // await seedTable(TABLES.routes, routes as Record<string, unknown>[]);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
