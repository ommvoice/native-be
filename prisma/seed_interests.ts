/// <reference types="node" />
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../api/database/database.config.js";
import { TABLES } from "../api/database/tables.js";

const interestCategories: { slug: string; name: string }[] = [
  { slug: "nature_exploration", name: "Nature & Exploration" },
  { slug: "movement_energy", name: "Movement & Energy" },
  { slug: "creativity_imagination", name: "Creativity & Imagination" },
  { slug: "learning_curiosity", name: "Learning & Curiosity" },
  { slug: "slowing_down", name: "Slowing Down" },
  { slug: "together_time", name: "Family Resets" },
  { slug: "special_memorable", name: "Special & Memorable Days Out" },
];

async function scanAll(tableName: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new ScanCommand({ TableName: tableName, ...(lastKey ? { ExclusiveStartKey: lastKey } : {}) }),
    );
    items.push(...((res.Items ?? []) as Record<string, unknown>[]));
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
  return items;
}

export async function seedInterestCategories(): Promise<Map<string, string>> {
  const existing = await scanAll(TABLES.interestCategories);
  const idBySlug = new Map(existing.map((i) => [i.slug as string, i.id as string]));
  const now = new Date().toISOString();

  for (const row of interestCategories) {
    const id = idBySlug.get(row.slug) ?? uuidv4();
    idBySlug.set(row.slug, id);
    await db.send(
      new PutCommand({
        TableName: TABLES.interestCategories,
        Item: { id, slug: row.slug, name: row.name, createdAt: now, updatedAt: now },
      }),
    );
  }

  console.log(`  Seeded ${interestCategories.length} interest categories.`);
  return idBySlug;
}

async function main() {
  console.log("Seeding interest categories...");
  await seedInterestCategories();
  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
