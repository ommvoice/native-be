/// <reference types="node" />
/**
 * Seeds the Venues/Events/Clubs/Routes DynamoDB tables from the static JSON
 * assets under app/shared/assets/ (venues.json, events.json, clubs.json,
 * routes.json — see AssetsService for the read-side equivalent).
 *
 * Usage: APP_ENV=dev npx tsx scripts/seed-opportunities.ts
 * (APP_ENV defaults to "dev" — see seed/config/index.ts for how the table
 * prefix/region are resolved from cdk/cdk.json context.)
 */
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { db, TABLES } from "../seed/config/index.js";
import venues from "../app/shared/assets/venues.json" with { type: "json" };
import events from "../app/shared/assets/events.json" with { type: "json" };
import clubs from "../app/shared/assets/clubs.json" with { type: "json" };
import routes from "../app/shared/assets/routes.json" with { type: "json" };

const BATCH_WRITE_MAX = 25;

async function seedTable(tableName: string, items: Record<string, unknown>[]): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_WRITE_MAX) {
    const chunk = items.slice(i, i + BATCH_WRITE_MAX);
    await db.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk.map((item) => ({ PutRequest: { Item: item } })),
        },
      }),
    );
  }
  console.log(`  ${tableName} — seeded ${items.length} items`);
}

async function main(): Promise<void> {
  console.log("Seeding opportunity tables...");
  await seedTable(TABLES.venues, venues as Record<string, unknown>[]);
  // await seedTable(TABLES.events, events as Record<string, unknown>[]);
  // await seedTable(TABLES.clubs, clubs as Record<string, unknown>[]);
  await seedTable(TABLES.routes, routes as Record<string, unknown>[]);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
