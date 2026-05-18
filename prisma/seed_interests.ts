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

const interestSubCategories: {
  categorySlug: string;
  slug: string;
  name: string;
  suitableForAge?: string | null;
  parentSlug?: string;
}[] = [
  // Nature & Exploration — roots
  { categorySlug: "nature_exploration", slug: "scenic_walks", name: "Scenic Walks & Wanders" },
  { categorySlug: "nature_exploration", slug: "green_spaces", name: "Green Spaces to Run Around" },
  { categorySlug: "nature_exploration", slug: "nature_wildlife", name: "Nature & Wildlife Exploration", suitableForAge: "8+" },
  { categorySlug: "nature_exploration", slug: "coastal_adventures", name: "Coastal Adventures" },
  { categorySlug: "nature_exploration", slug: "gardens_outdoor", name: "Gardens & Curated Outdoor Spaces" },
  { categorySlug: "nature_exploration", slug: "water_fun", name: "Water-Based Fun" },
  // Nature & Exploration — nested
  { categorySlug: "nature_exploration", parentSlug: "coastal_adventures", slug: "sailing", name: "Sailing", suitableForAge: "6+" },
  { categorySlug: "nature_exploration", parentSlug: "coastal_adventures", slug: "coasteering", name: "Coasteering", suitableForAge: "8+" },
  { categorySlug: "nature_exploration", parentSlug: "water_fun", slug: "paddleboarding", name: "Paddleboarding", suitableForAge: "8+" },
  { categorySlug: "nature_exploration", parentSlug: "water_fun", slug: "kayaking", name: "Kayaking", suitableForAge: "8+" },
  { categorySlug: "nature_exploration", parentSlug: "water_fun", slug: "surfing", name: "Surfing", suitableForAge: "6+" },
  // Movement & Energy — roots
  { categorySlug: "movement_energy", slug: "active_play_climbing", name: "Playgrounds & Adventure Play" },
  { categorySlug: "movement_energy", slug: "sporty_activities", name: "Sporty Activities" },
  { categorySlug: "movement_energy", slug: "wheels_routes", name: "Wheels & Rideable Routes" },
  { categorySlug: "movement_energy", slug: "soft_play", name: "Soft Play & Indoor Energy" },
  { categorySlug: "movement_energy", slug: "water_fun", name: "Water-Based Fun" },
  { categorySlug: "movement_energy", slug: "hands_on_learning", name: "Hands-On Learning" },
  // Movement & Energy — nested
  { categorySlug: "movement_energy", parentSlug: "active_play_climbing", slug: "climbing", name: "Climbing", suitableForAge: "6+" },
  { categorySlug: "movement_energy", parentSlug: "sporty_activities", slug: "football", name: "Football", suitableForAge: "6+" },
  { categorySlug: "movement_energy", parentSlug: "sporty_activities", slug: "tennis", name: "Tennis", suitableForAge: "5+" },
  { categorySlug: "movement_energy", parentSlug: "sporty_activities", slug: "athletics", name: "Athletics", suitableForAge: "7+" },
  { categorySlug: "movement_energy", parentSlug: "sporty_activities", slug: "gymnastics", name: "Gymnastics", suitableForAge: "7+" },
  { categorySlug: "movement_energy", parentSlug: "sporty_activities", slug: "martial_arts", name: "Martial Arts", suitableForAge: "6+" },
  { categorySlug: "movement_energy", parentSlug: "wheels_routes", slug: "skateboarding", name: "Skateboarding", suitableForAge: "7+" },
  { categorySlug: "movement_energy", parentSlug: "wheels_routes", slug: "rollerblades_skates", name: "Rollerblades / skates", suitableForAge: "6+" },
  { categorySlug: "movement_energy", parentSlug: "wheels_routes", slug: "motorcross", name: "Motorcross", suitableForAge: "6+" },
  { categorySlug: "movement_energy", parentSlug: "water_fun", slug: "paddleboarding", name: "Paddleboarding", suitableForAge: "8+" },
  { categorySlug: "movement_energy", parentSlug: "water_fun", slug: "kayaking", name: "Kayaking", suitableForAge: "8+" },
  { categorySlug: "movement_energy", parentSlug: "water_fun", slug: "surfing", name: "Surfing", suitableForAge: "6+" },
  // Creativity & Imagination — roots
  { categorySlug: "creativity_imagination", slug: "creative_play", name: "Creative & Expressive Play" },
  { categorySlug: "creativity_imagination", slug: "imaginative_play", name: "Imaginative & Role Play" },
  { categorySlug: "creativity_imagination", slug: "interactive_museums", name: "Interactive Museums & Discovery" },
  { categorySlug: "creativity_imagination", slug: "indoor_entertainment", name: "Indoor Entertainment" },
  { categorySlug: "creativity_imagination", slug: "historical_cultural", name: "Historical & Cultural Exploration" },
  // Creativity & Imagination — nested
  { categorySlug: "creativity_imagination", parentSlug: "creative_play", slug: "dance", name: "Dance", suitableForAge: "5+" },
  { categorySlug: "creativity_imagination", parentSlug: "creative_play", slug: "music", name: "Music", suitableForAge: "8+" },
  { categorySlug: "creativity_imagination", parentSlug: "creative_play", slug: "creative_writing", name: "Creative Writing", suitableForAge: "10+" },
  { categorySlug: "creativity_imagination", parentSlug: "imaginative_play", slug: "drama_acting", name: "Drama / Acting", suitableForAge: "5+" },
  // Learning & Curiosity — roots
  { categorySlug: "learning_curiosity", slug: "hands_on_learning", name: "Hands-On Learning" },
  { categorySlug: "learning_curiosity", slug: "interactive_museums", name: "Interactive Museums & Discovery" },
  { categorySlug: "learning_curiosity", slug: "historical_cultural", name: "Historical & Cultural Exploration" },
  { categorySlug: "learning_curiosity", slug: "animal_encounters", name: "Animal Encounters" },
  { categorySlug: "learning_curiosity", slug: "vehicles_transport", name: "Transport & Engineering" },
  // Learning & Curiosity — nested
  { categorySlug: "learning_curiosity", parentSlug: "hands_on_learning", slug: "coding", name: "Coding", suitableForAge: "8+" },
  { categorySlug: "learning_curiosity", parentSlug: "animal_encounters", slug: "horse_riding", name: "Horse Riding", suitableForAge: "8+" },
  { categorySlug: "learning_curiosity", parentSlug: "animal_encounters", slug: "animal_husbandry", name: "Animal Husbandry", suitableForAge: "8+" },
  { categorySlug: "learning_curiosity", parentSlug: "vehicles_transport", slug: "robotics", name: "Robotics", suitableForAge: "8+" },
  { categorySlug: "learning_curiosity", parentSlug: "vehicles_transport", slug: "construction", name: "Construction", suitableForAge: "8+" },
  // Slowing Down — roots
  { categorySlug: "slowing_down", slug: "sensory_soothing", name: "Sensory or Calming Experiences" },
  { categorySlug: "slowing_down", slug: "relaxed_cafe", name: "A Relaxed Coffee Stop" },
  // Slowing Down — nested
  { categorySlug: "slowing_down", parentSlug: "sensory_soothing", slug: "yoga", name: "Yoga", suitableForAge: "10+" },
  // Family Resets — roots
  { categorySlug: "together_time", slug: "family_dining", name: "Family Dining" },
  { categorySlug: "together_time", slug: "big_day_out", name: "A Big Day Out" },
  { categorySlug: "together_time", slug: "indoor_entertainment", name: "Indoor Entertainment" },
  { categorySlug: "together_time", slug: "relaxed_cafe", name: "A Relaxed Coffee Stop" },
  // Special & Memorable Days Out — roots
  { categorySlug: "special_memorable", slug: "a_big_day_out", name: "A Big Day Out" },
  { categorySlug: "special_memorable", slug: "indoor_entertainment", name: "Indoor Entertainment" },
  // Special & Memorable Days Out — nested
  { categorySlug: "special_memorable", parentSlug: "a_big_day_out", slug: "escape_rooms", name: "Escape rooms", suitableForAge: "8+" },
  { categorySlug: "special_memorable", parentSlug: "indoor_entertainment", slug: "go_karting", name: "Go-Karting", suitableForAge: "8+" },
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

export async function seedInterestSubCategories(categoryIdBySlug: Map<string, string>): Promise<void> {
  const existing = await scanAll(TABLES.interestSubCategories);
  const now = new Date().toISOString();

  // key: "categoryId|parentId|slug" → existing id
  const existingIdByKey = new Map<string, string>();
  for (const item of existing) {
    const key = `${item.categoryId as string}|${(item.parentId as string | null) ?? ""}|${item.slug as string}`;
    existingIdByKey.set(key, item.id as string);
  }

  // Seed roots first so we can look up their IDs for nested rows
  const rootIdByKey = new Map<string, string>(); // "categorySlug|slug" → id

  const roots = interestSubCategories.filter((r) => !r.parentSlug);
  const nested = interestSubCategories.filter((r) => r.parentSlug);

  for (const row of roots) {
    const categoryId = categoryIdBySlug.get(row.categorySlug);
    if (!categoryId) throw new Error(`Category not found: ${row.categorySlug}`);

    const key = `${categoryId}||${row.slug}`;
    const id = existingIdByKey.get(key) ?? uuidv4();
    rootIdByKey.set(`${row.categorySlug}|${row.slug}`, id);

    await db.send(
      new PutCommand({
        TableName: TABLES.interestSubCategories,
        Item: {
          id,
          slug: row.slug,
          name: row.name,
          suitableForAge: row.suitableForAge ?? null,
          categoryId,
          parentId: null,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }

  for (const row of nested) {
    const categoryId = categoryIdBySlug.get(row.categorySlug);
    if (!categoryId) throw new Error(`Category not found: ${row.categorySlug}`);

    const parentId = rootIdByKey.get(`${row.categorySlug}|${row.parentSlug!}`);
    if (!parentId) throw new Error(`Parent subcategory not found: ${row.categorySlug}/${row.parentSlug}`);

    const key = `${categoryId}|${parentId}|${row.slug}`;
    const id = existingIdByKey.get(key) ?? uuidv4();

    await db.send(
      new PutCommand({
        TableName: TABLES.interestSubCategories,
        Item: {
          id,
          slug: row.slug,
          name: row.name,
          suitableForAge: row.suitableForAge ?? null,
          categoryId,
          parentId,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }

  console.log(`  Seeded ${interestSubCategories.length} interest subcategories.`);
}

async function main() {
  console.log("Seeding interest categories...");
  const categoryIdBySlug = await seedInterestCategories();

  console.log("Seeding interest subcategories...");
  await seedInterestSubCategories(categoryIdBySlug);

  console.log("\nDone.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
