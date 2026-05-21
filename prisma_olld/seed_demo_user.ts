/// <reference types="node" />
import "dotenv/config";
import { PutCommand, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../api/database/database.config.js";
import { TABLES } from "../api/database/tables.js";

// ── Demo user definition ─────────────────────────────────────────────────────

const DEMO_USER = {
  email: "demo@nativefamily.com",
  sub: "demo-cognito-sub-001",
  role: "PARENT" as const,
};

const DEMO_PARENT = {
  firstNameOrNickName: "Alex",
  postCode: "HP2 7DB",
  latitude: "51.773282",
  longitude: "-0.434612",
  searchRadius: 30,
  // interest slugs to assign
  interestCategorySlugs: ["nature_exploration", "learning_curiosity"],
  interestSubCategorySlugs: ["nature_wildlife", "animal_encounters"],
};

const DEMO_CHILDREN = [
  {
    nameOrNickName: "Olivia",
    dateOfBirth: "2018-04-12",           // age ~7
    interestCategorySlugs: ["learning_curiosity", "nature_exploration"],
    interestSubCategorySlugs: ["animal_encounters", "nature_wildlife"],
    skillSlugs: ["learning_animal_encounters_horse_riding", "hands_on_learning_coding"],
  },
  {
    nameOrNickName: "Noah",
    dateOfBirth: "2021-09-03",           // age ~3-4
    interestCategorySlugs: ["movement_energy"],
    interestSubCategorySlugs: ["soft_play", "active_play_climbing"],
    skillSlugs: [],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

async function queryByIndex(
  tableName: string,
  indexName: string,
  keyName: string,
  keyValue: string,
): Promise<Record<string, unknown>[]> {
  const res = await db.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: `${keyName} = :v`,
      ExpressionAttributeValues: { ":v": keyValue },
    }),
  );
  return (res.Items ?? []) as Record<string, unknown>[];
}

function buildSlugIdMap(items: Record<string, unknown>[]): Map<string, string> {
  return new Map(items.map((i) => [i.slug as string, i.id as string]));
}

// ── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertUser(): Promise<string> {
  const existing = await queryByIndex(TABLES.users, "email-index", "email", DEMO_USER.email);
  if (existing[0]) {
    const id = existing[0].id as string;
    console.log(`  User already exists: ${DEMO_USER.email} (${id})`);
    return id;
  }
  const id = uuidv4();
  const now = new Date().toISOString();
  await db.send(
    new PutCommand({
      TableName: TABLES.users,
      Item: { id, email: DEMO_USER.email, sub: DEMO_USER.sub, role: DEMO_USER.role, createdAt: now, updatedAt: now },
    }),
  );
  console.log(`  Created user: ${DEMO_USER.email} (${id})`);
  return id;
}

async function upsertParent(userId: string, categoryIds: string[], subCategoryIds: string[]): Promise<string> {
  const existing = await queryByIndex(TABLES.parents, "userId-index", "userId", userId);
  const now = new Date().toISOString();

  if (existing[0]) {
    const id = existing[0].id as string;
    await db.send(
      new UpdateCommand({
        TableName: TABLES.parents,
        Key: { id },
        UpdateExpression:
          "SET firstNameOrNickName = :n, postCode = :pc, latitude = :lat, longitude = :lon, searchRadius = :sr, interestCategoryIds = :cats, interestSubCategoryIds = :subs, updatedAt = :ua",
        ExpressionAttributeValues: {
          ":n": DEMO_PARENT.firstNameOrNickName,
          ":pc": DEMO_PARENT.postCode,
          ":lat": DEMO_PARENT.latitude,
          ":lon": DEMO_PARENT.longitude,
          ":sr": DEMO_PARENT.searchRadius,
          ":cats": categoryIds,
          ":subs": subCategoryIds,
          ":ua": now,
        },
      }),
    );
    console.log(`  Updated parent: ${DEMO_PARENT.firstNameOrNickName} (${id})`);
    return id;
  }

  const id = uuidv4();
  await db.send(
    new PutCommand({
      TableName: TABLES.parents,
      Item: {
        id,
        userId,
        firstNameOrNickName: DEMO_PARENT.firstNameOrNickName,
        postCode: DEMO_PARENT.postCode,
        latitude: DEMO_PARENT.latitude,
        longitude: DEMO_PARENT.longitude,
        searchRadius: DEMO_PARENT.searchRadius,
        interestCategoryIds: categoryIds,
        interestSubCategoryIds: subCategoryIds,
        createdAt: now,
        updatedAt: now,
      },
    }),
  );
  console.log(`  Created parent: ${DEMO_PARENT.firstNameOrNickName} (${id})`);
  return id;
}

async function upsertChild(
  parentId: string,
  child: (typeof DEMO_CHILDREN)[number],
  categoryIds: string[],
  subCategoryIds: string[],
  skillIds: string[],
): Promise<string> {
  const existing = await queryByIndex(TABLES.children, "parentId-index", "parentId", parentId);
  const match = (existing as Record<string, unknown>[]).find(
    (c) => c.nameOrNickName === child.nameOrNickName,
  );
  const now = new Date().toISOString();

  if (match) {
    const id = match.id as string;
    await db.send(
      new UpdateCommand({
        TableName: TABLES.children,
        Key: { id },
        UpdateExpression:
          "SET dateOfBirth = :dob, interestCategoryIds = :cats, interestSubCategoryIds = :subs, skillIds = :skills, updatedAt = :ua",
        ExpressionAttributeValues: {
          ":dob": child.dateOfBirth,
          ":cats": categoryIds,
          ":subs": subCategoryIds,
          ":skills": skillIds,
          ":ua": now,
        },
      }),
    );
    console.log(`    Updated child: ${child.nameOrNickName} (${id})`);
    return id;
  }

  const id = uuidv4();
  await db.send(
    new PutCommand({
      TableName: TABLES.children,
      Item: {
        id,
        parentId,
        nameOrNickName: child.nameOrNickName,
        dateOfBirth: child.dateOfBirth,
        interestCategoryIds: categoryIds,
        interestSubCategoryIds: subCategoryIds,
        skillIds,
        createdAt: now,
        updatedAt: now,
      },
    }),
  );
  console.log(`    Created child: ${child.nameOrNickName} (${id})`);
  return id;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nSeeding demo user...\n");

  // Load reference data maps
  const [allCategories, allSubCategories, allSkills] = await Promise.all([
    scanAll(TABLES.interestCategories),
    scanAll(TABLES.interestSubCategories),
    scanAll(TABLES.skills),
  ]);

  const categoryIdBySlug = buildSlugIdMap(allCategories);
  const subCategoryIdBySlug = buildSlugIdMap(allSubCategories);
  const skillIdBySlug = buildSlugIdMap(allSkills);

  function resolveSlugs(slugs: string[], map: Map<string, string>, label: string): string[] {
    return slugs.map((slug) => {
      const id = map.get(slug);
      if (!id) throw new Error(`${label} slug not found: "${slug}" — run seed:all first`);
      return id;
    });
  }

  // 1. User
  const userId = await upsertUser();

  // 2. Parent with interest IDs
  const parentCategoryIds = resolveSlugs(DEMO_PARENT.interestCategorySlugs, categoryIdBySlug, "Interest category");
  const parentSubCategoryIds = resolveSlugs(DEMO_PARENT.interestSubCategorySlugs, subCategoryIdBySlug, "Interest sub-category");
  const parentId = await upsertParent(userId, parentCategoryIds, parentSubCategoryIds);

  // 3. Children
  console.log("  Seeding children...");
  for (const child of DEMO_CHILDREN) {
    const childCategoryIds = resolveSlugs(child.interestCategorySlugs, categoryIdBySlug, "Interest category");
    const childSubCategoryIds = resolveSlugs(child.interestSubCategorySlugs, subCategoryIdBySlug, "Interest sub-category");
    const childSkillIds = resolveSlugs(child.skillSlugs, skillIdBySlug, "Skill");
    await upsertChild(parentId, child, childCategoryIds, childSubCategoryIds, childSkillIds);
  }

  console.log(`
Demo user ready:
  email    : ${DEMO_USER.email}
  parentId : ${parentId}
  children : ${DEMO_CHILDREN.map((c) => c.nameOrNickName).join(", ")}
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
