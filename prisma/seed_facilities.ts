/// <reference types="node" />
import "dotenv/config";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../api/database/database.config.js";
import { TABLES } from "../api/database/tables.js";
import type { FacilityType } from "../api/types/db.js";

export const FACILITY_ROWS: { type: FacilityType; slug: string; label: string }[] = [
  // General
  { type: "GENERAL", slug: "toilets", label: "Toilets" },
  { type: "GENERAL", slug: "disabled_toilets", label: "Disabled toilets" },
  { type: "GENERAL", slug: "baby_changing", label: "Baby changing" },
  { type: "GENERAL", slug: "showers_changing", label: "Showers / changing facilities" },
  { type: "GENERAL", slug: "benches", label: "Bench Seating" },
  { type: "GENERAL", slug: "picnic_benches", label: "Picnic Benches" },
  { type: "GENERAL", slug: "indoor_seating", label: "Indoor Seating" },
  { type: "GENERAL", slug: "outdoor_seating", label: "Outdoor Seating" },
  // Parent
  { type: "PARENT", slug: "hot_drinks", label: "Hot Drinks" },
  { type: "PARENT", slug: "comfy_seating", label: "Comfy Seating / Sofas" },
  { type: "PARENT", slug: "sunloungers", label: "Sunloungers" },
  { type: "PARENT", slug: "wifi", label: "WiFi" },
  { type: "PARENT", slug: "hot_cold_food", label: "Hot & Cold food" },
  { type: "PARENT", slug: "clear_sightlines", label: "Clear Sightlines" },
  { type: "PARENT", slug: "snacks", label: "Snacks" },
  { type: "PARENT", slug: "drinks_stand", label: "Drinks stand" },
  { type: "PARENT", slug: "sweet_treats", label: "Sweet treats" },
  { type: "PARENT", slug: "log_burner", label: "Log burner" },
  { type: "PARENT", slug: "outdoor_terrace", label: "Outdoor terrace" },
  // Kid
  { type: "KID", slug: "colouring", label: "Colouring" },
  { type: "KID", slug: "ice_creams", label: "Ice creams" },
  { type: "KID", slug: "activity_sheets", label: "Activity sheets" },
  { type: "KID", slug: "activity_trail", label: "Activity trail" },
  { type: "KID", slug: "treasure_hunt", label: "Treasure hunt" },
  { type: "KID", slug: "childrens_trail", label: "Children's trail" },
  { type: "KID", slug: "clues_games", label: "Clues / games" },
  { type: "KID", slug: "indoor_games", label: "Indoor games (puzzles, boards)" },
  { type: "KID", slug: "play_equipment", label: "Play equipment" },
  // Dog
  { type: "DOG", slug: "dog_bins", label: "Poo Bins" },
  { type: "DOG", slug: "dog_wash", label: "Dog Wash" },
  { type: "DOG", slug: "lead_only", label: "Dogs On Leads" },
];

async function scanIdsBySlug(tableName: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "id, slug",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) {
      map.set(item.slug as string, item.id as string);
    }
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
  return map;
}

export async function seedFacilities() {
  const existingIdBySlug = await scanIdsBySlug(TABLES.facilities);
  const now = new Date().toISOString();

  for (const row of FACILITY_ROWS) {
    const id = existingIdBySlug.get(row.slug) ?? uuidv4();
    await db.send(
      new PutCommand({
        TableName: TABLES.facilities,
        Item: { id, type: row.type, slug: row.slug, label: row.label, createdAt: now, updatedAt: now },
      }),
    );
  }

  console.log(`  Seeded ${FACILITY_ROWS.length} facilities.`);
}

seedFacilities().catch((e) => {
  console.error(e);
  process.exit(1);
});
