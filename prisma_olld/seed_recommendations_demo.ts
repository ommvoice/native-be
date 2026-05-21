/// <reference types="node" />
/**
 * Demo data for the recommendations module.
 * Depends on `npm run seed:interests` so interest rows exist.
 *
 * Run: `npm run seed:rec-demo`
 */
import "dotenv/config";
import { DeleteCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../api/database/database.config.js";
import { TABLES } from "../api/database/tables.js";

const HP2_7DB = "HP2 7DB";
const HP2_LAT = "51.773282";
const HP2_LON = "-0.434612";

const DEMO_GEO = {
  venue: { postCode: "HP1 1BB", latitude: "51.751393", longitude: "-0.471936" },
  event: { postCode: "WD3 3RX", latitude: "51.651107", longitude: "-0.431916" },
  club:  { postCode: "AL2 1AF", latitude: "51.712302", longitude: "-0.300929" },
  route: { postCode: "MK40 1DY", latitude: "52.136759", longitude: "-0.478306" },
} as const;

async function findCategoryBySlug(slug: string): Promise<{ id: string } | null> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.interestCategories,
      IndexName: "slug-index",
      KeyConditionExpression: "slug = :slug",
      ExpressionAttributeValues: { ":slug": slug },
      Limit: 1,
    }),
  );
  const item = res.Items?.[0];
  return item ? { id: item.id as string } : null;
}

async function findSubCategoryBySlug(
  categoryId: string,
  slug: string,
): Promise<{ id: string } | null> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.interestSubCategories,
      IndexName: "categoryId-index",
      KeyConditionExpression: "categoryId = :cid",
      FilterExpression: "slug = :slug",
      ExpressionAttributeValues: { ":cid": categoryId, ":slug": slug },
    }),
  );
  const item = res.Items?.find(
    (i) => i.parentId === null || i.parentId === undefined,
  );
  return item ? { id: item.id as string } : null;
}

async function requireCategory(slug: string) {
  const c = await findCategoryBySlug(slug);
  if (!c) throw new Error(`Run seed:interests first — missing interest category "${slug}"`);
  return c;
}

async function requireSubCategory(categorySlug: string, subSlug: string) {
  const cat = await requireCategory(categorySlug);
  const sub = await findSubCategoryBySlug(cat.id, subSlug);
  if (!sub)
    throw new Error(
      `Run seed:interests first — missing subcategory "${subSlug}" under "${categorySlug}"`,
    );
  return sub;
}

async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.users,
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
      Limit: 1,
    }),
  );
  const item = res.Items?.[0];
  return item ? { id: item.id as string } : null;
}

async function findParentByUserId(userId: string): Promise<{ id: string } | null> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.parents,
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      Limit: 1,
    }),
  );
  const item = res.Items?.[0];
  return item ? { id: item.id as string } : null;
}

async function deleteChildrenByParentAndNames(parentId: string, names: string[]) {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.children,
      IndexName: "parentId-index",
      KeyConditionExpression: "parentId = :pid",
      ExpressionAttributeValues: { ":pid": parentId },
    }),
  );
  for (const item of res.Items ?? []) {
    if (names.includes(item.nameOrNickName as string)) {
      await db.send(new DeleteCommand({ TableName: TABLES.children, Key: { id: item.id } }));
    }
  }
}

async function upsertDemoParent(input: {
  email: string;
  sub: string;
  firstName: string;
  categorySlugs: string[];
  subCategoryPairs: { categorySlug: string; subSlug: string }[];
  children: {
    name: string;
    dateOfBirth: Date;
    categorySlugs: string[];
    subCategoryPairs: { categorySlug: string; subSlug: string }[];
  }[];
}) {
  const now = new Date().toISOString();

  const categoryIds = await Promise.all(
    input.categorySlugs.map(async (slug) => (await requireCategory(slug)).id),
  );
  const subCategoryIds = await Promise.all(
    input.subCategoryPairs.map(
      async ({ categorySlug, subSlug }) => (await requireSubCategory(categorySlug, subSlug)).id,
    ),
  );

  let user = await findUserByEmail(input.email);
  if (!user) {
    const id = uuidv4();
    await db.send(
      new PutCommand({
        TableName: TABLES.users,
        Item: { id, email: input.email, sub: input.sub, role: "PARENT", createdAt: now, updatedAt: now },
      }),
    );
    user = { id };
  }

  let parent = await findParentByUserId(user.id);
  const parentId = parent?.id ?? uuidv4();
  await db.send(
    new PutCommand({
      TableName: TABLES.parents,
      Item: {
        id: parentId,
        userId: user.id,
        postCode: HP2_7DB,
        firstNameOrNickName: input.firstName,
        latitude: HP2_LAT,
        longitude: HP2_LON,
        searchRadius: 80,
        interestCategoryIds: categoryIds,
        interestSubCategoryIds: subCategoryIds,
        createdAt: now,
        updatedAt: now,
      },
    }),
  );
  parent = { id: parentId };

  await deleteChildrenByParentAndNames(
    parent.id,
    input.children.map((c) => c.name),
  );

  for (const ch of input.children) {
    const chCatIds = await Promise.all(
      ch.categorySlugs.map(async (slug) => (await requireCategory(slug)).id),
    );
    const chSubIds = await Promise.all(
      ch.subCategoryPairs.map(
        async ({ categorySlug, subSlug }) => (await requireSubCategory(categorySlug, subSlug)).id,
      ),
    );
    await db.send(
      new PutCommand({
        TableName: TABLES.children,
        Item: {
          id: uuidv4(),
          parentId: parent.id,
          nameOrNickName: ch.name,
          dateOfBirth: ch.dateOfBirth.toISOString(),
          interestCategoryIds: chCatIds,
          interestSubCategoryIds: chSubIds,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }

  return parent;
}

async function deleteByName(tableName: string, nameField: string, name: string) {
  let lastKey: Record<string, unknown> | undefined;
  const ids: string[] = [];
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "#n = :name",
        ExpressionAttributeNames: { "#n": nameField },
        ExpressionAttributeValues: { ":name": name },
        ProjectionExpression: "id",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) ids.push(item.id as string);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  for (const id of ids) {
    await db.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
  }
}

async function replaceDemoOpportunities() {
  const VENUE_NAME = "Rec Demo — Nature Barn (venue)";
  const EVENT_NAME = "Rec Demo — Wildlife Morning (event)";
  const CLUB_NAME  = "Rec Demo — Tumble Tots Club";
  const ROUTE_NAME = "Rec Demo — Gade Valley Walk (route)";
  const now = new Date().toISOString();

  await deleteByName(TABLES.opportunityVenues, "name", VENUE_NAME);
  await deleteByName(TABLES.opportunityEvents, "name", EVENT_NAME);
  await deleteByName(TABLES.opportunityClubs,  "name", CLUB_NAME);
  await deleteByName(TABLES.opportunityRoutes, "name", ROUTE_NAME);

  await db.send(
    new PutCommand({
      TableName: TABLES.opportunityVenues,
      Item: {
        id: uuidv4(),
        name: VENUE_NAME,
        description: "Demo venue near Hemel Hempstead; interest tags align with nature_exploration.",
        postCode: DEMO_GEO.venue.postCode,
        latitude: DEMO_GEO.venue.latitude,
        longitude: DEMO_GEO.venue.longitude,
        venuePostcode: DEMO_GEO.venue.postCode,
        themeSlug: "animal_encounters",
        themeVariantSlug: "animal_parks_and_zoos",
        activityGroupSlug: "special_day_out",
        terrainTypeSlug: "flat",
        venueSettingSlug: "outside",
        parkingProvisionSlug: "paid_car_park",
        adultCost: 12,
        childCost: 8,
        infantCost: 0,
        interestTags: "nature_exploration,nature_wildlife,animal_encounters",
        ageSuitabilitySlugs: ["age_3", "age_4", "age_5", "age_6", "age_7", "age_8"],
        generalFacilitySlugs: ["toilets", "baby_changing"],
        kidsFacilitySlugs: ["play_equipment"],
        parentFacilitySlugs: ["hot_drinks"],
        dogFacilitySlugs: ["lead_only"],
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  await db.send(
    new PutCommand({
      TableName: TABLES.opportunityEvents,
      Item: {
        id: uuidv4(),
        name: EVENT_NAME,
        description: "Demo event west of London; tags match learning_curiosity + animal_encounters.",
        themeSlug: "animal_encounters",
        eventTypeSlug: "family_fun_day",
        activityGroupSlug: "low_effort",
        postCode: DEMO_GEO.event.postCode,
        latitude: DEMO_GEO.event.latitude,
        longitude: DEMO_GEO.event.longitude,
        venuePostCode: DEMO_GEO.event.postCode,
        startDate: "2026-05-10",
        startTime: "10:00",
        finishTime: "12:00",
        venueSettingSlug: "outside",
        adultCost: 0,
        childCost: 0,
        infantCost: 0,
        interestTags: "learning_curiosity,animal_encounters",
        ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8", "age_9"],
        generalFacilitySlugs: ["toilets"],
        kidsFacilitySlugs: [],
        parentFacilitySlugs: [],
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  await db.send(
    new PutCommand({
      TableName: TABLES.opportunityClubs,
      Item: {
        id: uuidv4(),
        name: CLUB_NAME,
        description: "Demo weekly club; tags match movement_energy + soft_play.",
        themeSlug: "nature_and_wildlife_exploration",
        themeVariantSlug: "forest_school",
        postCode: DEMO_GEO.club.postCode,
        latitude: DEMO_GEO.club.latitude,
        longitude: DEMO_GEO.club.longitude,
        venuePostCode: DEMO_GEO.club.postCode,
        dayOfWeekSlug: "saturday",
        startTime: "09:30",
        finishTime: "10:30",
        activityGroupSlug: "low_effort",
        clubFormatSlug: "stay_and_play_supervised",
        clubFrequencySlug: "weekly",
        parkingProvisionSlug: "free_car_park",
        venueSettingSlug: "outside",
        adultCost: 8,
        childCost: 6,
        infantCost: 0,
        interestTags: "movement_energy,soft_play",
        ageSuitabilitySlugs: ["age_2", "age_3", "age_4", "age_5"],
        generalFacilitySlugs: ["toilets"],
        kidsFacilitySlugs: ["play_equipment"],
        parentFacilitySlugs: [],
        createdAt: now,
        updatedAt: now,
      },
    }),
  );

  await db.send(
    new PutCommand({
      TableName: TABLES.opportunityRoutes,
      Item: {
        id: uuidv4(),
        name: ROUTE_NAME,
        description: "Demo circular walk near Bedford (~35 mi from HP2); still within parent search radius.",
        themeSlug: "scenic_walks_and_wanders",
        routeTypeSlug: "circular",
        routeDistanceMiles: 2.5,
        difficultyRatingSlug: "easy",
        activityGroupSlug: "energy_burner",
        postCode: DEMO_GEO.route.postCode,
        latitude: DEMO_GEO.route.latitude,
        longitude: DEMO_GEO.route.longitude,
        startPointPostCode: DEMO_GEO.route.postCode,
        parkingProvisionSlug: "free_car_park",
        venueSettingSlug: "outside",
        adultCost: 0,
        childCost: 0,
        infantCost: 0,
        interestTags: "nature_exploration,scenic_walks",
        routeSuitabilitySlugs: ["buggy", "carriers"],
        terrainTypeSlugs: ["undulating"],
        generalFacilitySlugs: ["picnic_benches"],
        kidsFacilitySlugs: [],
        parentFacilitySlugs: [],
        dogFacilitySlugs: ["dog_bins"],
        createdAt: now,
        updatedAt: now,
      },
    }),
  );
}

async function main() {
  console.log("Seeding recommendation demo parents (postcode HP2 7DB)…");

  await upsertDemoParent({
    email: "rec-demo-parent-a@example.com",
    sub: "rec-demo-parent-a-sub",
    firstName: "Rec Demo Alex",
    categorySlugs: ["nature_exploration"],
    subCategoryPairs: [{ categorySlug: "nature_exploration", subSlug: "nature_wildlife" }],
    children: [
      {
        name: "Rec Demo Amy",
        dateOfBirth: new Date("2018-06-01"),
        categorySlugs: ["learning_curiosity"],
        subCategoryPairs: [{ categorySlug: "learning_curiosity", subSlug: "animal_encounters" }],
      },
    ],
  });

  await upsertDemoParent({
    email: "rec-demo-parent-b@example.com",
    sub: "rec-demo-parent-b-sub",
    firstName: "Rec Demo Blake",
    categorySlugs: ["learning_curiosity"],
    subCategoryPairs: [{ categorySlug: "learning_curiosity", subSlug: "animal_encounters" }],
    children: [
      {
        name: "Rec Demo Ben",
        dateOfBirth: new Date("2021-03-20"),
        categorySlugs: ["movement_energy"],
        subCategoryPairs: [{ categorySlug: "movement_energy", subSlug: "soft_play" }],
      },
    ],
  });

  console.log("Seeding recommendation demo opportunities…");
  await replaceDemoOpportunities();

  console.log("Done. Parent A: rec-demo-parent-a@example.com — nature + child with animals (age ~7).");
  console.log("Parent B: rec-demo-parent-b@example.com — animals + toddler soft play.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
