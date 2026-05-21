/**
 * ~50 opportunities (venues, events, clubs, routes) along London → Manchester with lat/long,
 * interest categories/subcategories (idempotent), a demo parent + child, and driving legs for
 * GET /api/search/opportunities in Swagger.
 *
 * Run: `npm run seed:swagger-corridor`
 */
import "dotenv/config";
import { DeleteCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../api/database/database.config.js";
import { TABLES } from "../api/database/tables.js";
import type { OpportunityRecordType } from "../api/types/db.js";
import { seedInterestCategories, seedInterestSubCategories } from "./seed_interests.js";
import { FACILITY_ROWS, seedFacilities } from "./seed_facilities.js";

const NAME_PREFIX = "Corridor Seed";

const LONDON = { lat: 51.507351, lon: -0.127758 };
const MANCHESTER = { lat: 53.480759, lon: -2.242631 };

const DEMO_USER_EMAIL = "swagger-corridor-parent@example.com";
const DEMO_USER_SUB = "swagger-corridor-parent-sub";
const DEMO_CHILD_NAME = "Swagger Corridor Child";

const INTEREST_TAG_ROTATION = [
  "nature_wildlife",
  "scenic_walks",
  "green_spaces",
  "animal_encounters",
  "soft_play",
  "creative_play",
  "hands_on_learning",
  "interactive_museums",
] as const;

const VENUE_THEMES = [
  "animal_encounters",
  "nature_and_wildlife_exploration",
  "scenic_walks_and_wanders",
  "green_spaces_to_run_around",
] as const;

const EVENT_THEMES = [
  "animal_encounters",
  "a_big_day_out",
  "nature_and_wildlife_exploration",
  "scenic_walks_and_wanders",
  "green_spaces_to_run_around",
] as const;

const EVENT_TYPES = [
  "family_fun_day",
  "festival",
  "workshop_or_talk",
  "nature_based",
  "sport_based",
  "entertainment",
] as const;

const CLUB_THEMES = [
  "nature_and_wildlife_exploration",
  "animal_encounters",
  "green_spaces_to_run_around",
  "scenic_walks_and_wanders",
] as const;

const ROUTE_THEMES = [
  "scenic_walks_and_wanders",
  "nature_and_wildlife_exploration",
  "green_spaces_to_run_around",
] as const;

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function corridorFacilitySlices(i: number) {
  const gen = FACILITY_ROWS.filter((r) => r.type === "GENERAL").map((r) => r.slug);
  const kid = FACILITY_ROWS.filter((r) => r.type === "KID").map((r) => r.slug);
  const par = FACILITY_ROWS.filter((r) => r.type === "PARENT").map((r) => r.slug);
  const dog = FACILITY_ROWS.filter((r) => r.type === "DOG").map((r) => r.slug);
  return {
    general: [gen[i % gen.length]!, gen[(i + 1) % gen.length]!],
    kids: [kid[i % kid.length]!],
    parent: [par[i % par.length]!],
    dog: [dog[i % dog.length]!],
  };
}

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R_MILES = 3958.7613;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function coordKey(n: number): string {
  return n.toFixed(6);
}

function corridorGeo(index: number, total: number) {
  const t = total <= 1 ? 0 : index / (total - 1);
  const latNum = LONDON.lat + t * (MANCHESTER.lat - LONDON.lat);
  const lonNum = LONDON.lon + t * (MANCHESTER.lon - LONDON.lon);
  return { latStr: coordKey(latNum), lonStr: coordKey(lonNum), latNum, lonNum };
}

function syntheticDrivingFromCrowMiles(crowMiles: number) {
  const crowMeters = crowMiles * 1609.344;
  const drivingMeters = Math.max(200, Math.round(crowMeters * 1.22));
  const durationSeconds = Math.max(120, Math.round(drivingMeters / 14));
  return { drivingDistanceMeters: drivingMeters, drivingDurationSeconds: durationSeconds };
}

async function scanByNamePrefix(tableName: string, nameField: string, prefix: string): Promise<string[]> {
  let lastKey: Record<string, unknown> | undefined;
  const ids: string[] = [];
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "begins_with(#n, :prefix)",
        ExpressionAttributeNames: { "#n": nameField },
        ExpressionAttributeValues: { ":prefix": prefix },
        ProjectionExpression: "id",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) ids.push(item.id as string);
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
  return ids;
}

async function deletePriorCorridorData() {
  const [venueIds, eventIds, clubIds, routeIds] = await Promise.all([
    scanByNamePrefix(TABLES.opportunityVenues, "name", NAME_PREFIX),
    scanByNamePrefix(TABLES.opportunityEvents, "name", NAME_PREFIX),
    scanByNamePrefix(TABLES.opportunityClubs, "name", NAME_PREFIX),
    scanByNamePrefix(TABLES.opportunityRoutes, "name", NAME_PREFIX),
  ]);

  for (const id of venueIds)
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityVenues, Key: { id } }));
  for (const id of eventIds)
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityEvents, Key: { id } }));
  for (const id of clubIds)
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityClubs, Key: { id } }));
  for (const id of routeIds)
    await db.send(new DeleteCommand({ TableName: TABLES.opportunityRoutes, Key: { id } }));
}

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

async function findSubCategoryBySlug(categoryId: string, slug: string): Promise<{ id: string } | null> {
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
  if (!c) throw new Error(`Missing interest category "${slug}" — run seed:interests first.`);
  return c;
}

async function requireSubCategory(categorySlug: string, subSlug: string) {
  const cat = await requireCategory(categorySlug);
  const sub = await findSubCategoryBySlug(cat.id, subSlug);
  if (!sub) throw new Error(`Missing root subcategory "${subSlug}" under "${categorySlug}".`);
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

async function findChildByParentAndName(parentId: string, name: string): Promise<{ id: string } | null> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.children,
      IndexName: "parentId-index",
      KeyConditionExpression: "parentId = :pid",
      FilterExpression: "nameOrNickName = :name",
      ExpressionAttributeValues: { ":pid": parentId, ":name": name },
      Limit: 1,
    }),
  );
  const item = res.Items?.[0];
  return item ? { id: item.id as string } : null;
}

async function upsertDemoParentWithChild(input: {
  parentLat: string;
  parentLon: string;
  postCode: string;
}): Promise<{ parentId: string; childId: string }> {
  const now = new Date().toISOString();

  const natureCat = await requireCategory("nature_exploration");
  const learningCat = await requireCategory("learning_curiosity");
  const subNatureWildlife = await requireSubCategory("nature_exploration", "nature_wildlife");
  const subAnimalEncounters = await requireSubCategory("learning_curiosity", "animal_encounters");

  let user = await findUserByEmail(DEMO_USER_EMAIL);
  if (!user) {
    const id = uuidv4();
    await db.send(
      new PutCommand({
        TableName: TABLES.users,
        Item: { id, email: DEMO_USER_EMAIL, sub: DEMO_USER_SUB, role: "PARENT", createdAt: now, updatedAt: now },
      }),
    );
    user = { id };
  }

  let parent = await findParentByUserId(user.id);
  const parentItem = {
    id: parent?.id ?? uuidv4(),
    userId: user.id,
    postCode: input.postCode,
    firstNameOrNickName: "Swagger Corridor Parent",
    latitude: input.parentLat,
    longitude: input.parentLon,
    searchRadius: 400,
    interestCategoryIds: [natureCat.id],
    interestSubCategoryIds: [subNatureWildlife.id],
    createdAt: now,
    updatedAt: now,
  };
  await db.send(new PutCommand({ TableName: TABLES.parents, Item: parentItem }));
  parent = { id: parentItem.id };

  let child = await findChildByParentAndName(parent.id, DEMO_CHILD_NAME);
  const childItem = {
    id: child?.id ?? uuidv4(),
    parentId: parent.id,
    nameOrNickName: DEMO_CHILD_NAME,
    dateOfBirth: new Date("2019-04-10").toISOString(),
    interestCategoryIds: [learningCat.id],
    interestSubCategoryIds: [subAnimalEncounters.id],
    createdAt: now,
    updatedAt: now,
  };
  await db.send(new PutCommand({ TableName: TABLES.children, Item: childItem }));
  child = { id: childItem.id };

  return { parentId: parent.id, childId: child.id };
}

async function createDrivingLeg(input: {
  parentId: string;
  parentPostCode: string;
  parentLat: string;
  parentLon: string;
  opportunityType: OpportunityRecordType;
  opportunityId: string;
  oppPostCode: string | null;
  oppLat: string;
  oppLon: string;
}) {
  const crow = haversineDistanceMiles(
    Number.parseFloat(input.parentLat),
    Number.parseFloat(input.parentLon),
    Number.parseFloat(input.oppLat),
    Number.parseFloat(input.oppLon),
  );
  const { drivingDistanceMeters, drivingDurationSeconds } = syntheticDrivingFromCrowMiles(crow);
  const now = new Date().toISOString();
  const typeId = `${input.opportunityType}#${input.opportunityId}`;

  await db.send(
    new PutCommand({
      TableName: TABLES.drivingLegs,
      Item: {
        parentId: input.parentId,
        typeId,
        opportunityType: input.opportunityType,
        opportunityId: input.opportunityId,
        parentPostCode: input.parentPostCode,
        parentLatitude: input.parentLat,
        parentLongitude: input.parentLon,
        opportunityPostCode: input.oppPostCode?.trim() ?? null,
        opportunityLatitude: input.oppLat,
        opportunityLongitude: input.oppLon,
        drivingDistanceMeters,
        drivingDurationSeconds,
        updatedAt: now,
      },
    }),
  );
}

const TOTAL_POINTS = 50;
const COUNTS = { venues: 13, events: 12, clubs: 13, routes: 12 } as const;

function indexRanges() {
  let start = 0;
  const v = { from: start, to: start + COUNTS.venues - 1 };
  start += COUNTS.venues;
  const e = { from: start, to: start + COUNTS.events - 1 };
  start += COUNTS.events;
  const c = { from: start, to: start + COUNTS.clubs - 1 };
  start += COUNTS.clubs;
  const r = { from: start, to: start + COUNTS.routes - 1 };
  return { v, e, c, r };
}

async function main() {
  console.log("Seeding interest categories & subcategories (idempotent)…");
  const categoryIdBySlug = await seedInterestCategories();
  await seedInterestSubCategories(categoryIdBySlug);

  console.log("Seeding facilities…");
  await seedFacilities();

  const parentLatStr = coordKey(LONDON.lat);
  const parentLonStr = coordKey(LONDON.lon);
  const { parentId, childId } = await upsertDemoParentWithChild({
    parentLat: parentLatStr,
    parentLon: parentLonStr,
    postCode: "SW1A 1AA",
  });

  console.log("Removing prior corridor seed opportunities…");
  await deletePriorCorridorData();

  const { v, e, c, r } = indexRanges();
  const now = new Date().toISOString();
  const created: { type: OpportunityRecordType; id: string; latStr: string; lonStr: string; postCode: string }[] = [];

  console.log("Creating venues…");
  for (let i = v.from; i <= v.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const fac = corridorFacilitySlices(i);
    const id = uuidv4();
    await db.send(
      new PutCommand({
        TableName: TABLES.opportunityVenues,
        Item: {
          id,
          name: `${NAME_PREFIX} Venue ${i + 1}`,
          description: `Seeded venue ${i + 1} along London–Manchester corridor.`,
          postCode: "M1 1AE",
          latitude: g.latStr,
          longitude: g.lonStr,
          venuePostcode: "M1 1AE",
          themeSlug: VENUE_THEMES[i % VENUE_THEMES.length],
          themeVariantSlug: "animal_parks_and_zoos",
          activityGroupSlug: "special_day_out",
          terrainTypeSlug: "flat",
          venueSettingSlug: "outside",
          parkingProvisionSlug: "free_car_park",
          adultCost: 10 + (i % 5),
          childCost: 6,
          infantCost: 0,
          interestTags: INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length],
          ageSuitabilitySlugs: ["age_3", "age_4", "age_5", "age_6", "age_7", "age_8"],
          generalFacilitySlugs: fac.general,
          kidsFacilitySlugs: fac.kids,
          parentFacilitySlugs: fac.parent,
          dogFacilitySlugs: fac.dog,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
    created.push({ type: "venue", id, latStr: g.latStr, lonStr: g.lonStr, postCode: "M1 1AE" });
  }

  console.log("Creating events…");
  for (let i = e.from; i <= e.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const fac = corridorFacilitySlices(i);
    const id = uuidv4();
    await db.send(
      new PutCommand({
        TableName: TABLES.opportunityEvents,
        Item: {
          id,
          name: `${NAME_PREFIX} Event ${i + 1}`,
          description: `Seeded event ${i + 1} along London–Manchester corridor.`,
          themeSlug: EVENT_THEMES[i % EVENT_THEMES.length],
          eventTypeSlug: EVENT_TYPES[i % EVENT_TYPES.length],
          activityGroupSlug: "low_effort",
          postCode: "B1 1AA",
          latitude: g.latStr,
          longitude: g.lonStr,
          venuePostCode: "B1 1AA",
          startDate: `2026-${String((i % 6) + 5).padStart(2, "0")}-15`,
          startTime: "10:00",
          finishTime: "14:00",
          venueSettingSlug: "outside",
          adultCost: 0,
          childCost: 5,
          infantCost: 0,
          interestTags: INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length],
          ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
          generalFacilitySlugs: fac.general,
          kidsFacilitySlugs: fac.kids,
          parentFacilitySlugs: fac.parent,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
    created.push({ type: "event", id, latStr: g.latStr, lonStr: g.lonStr, postCode: "B1 1AA" });
  }

  console.log("Creating clubs…");
  for (let i = c.from; i <= c.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const fac = corridorFacilitySlices(i);
    const id = uuidv4();
    await db.send(
      new PutCommand({
        TableName: TABLES.opportunityClubs,
        Item: {
          id,
          name: `${NAME_PREFIX} Club ${i + 1}`,
          description: `Seeded club ${i + 1} along London–Manchester corridor.`,
          themeSlug: CLUB_THEMES[i % CLUB_THEMES.length],
          themeVariantSlug: "forest_school",
          postCode: "CV1 1AA",
          latitude: g.latStr,
          longitude: g.lonStr,
          venuePostCode: "CV1 1AA",
          dayOfWeekSlug: DAYS[i % DAYS.length],
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
          interestTags: INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length],
          ageSuitabilitySlugs: ["age_2", "age_3", "age_4", "age_5"],
          generalFacilitySlugs: fac.general,
          kidsFacilitySlugs: fac.kids,
          parentFacilitySlugs: fac.parent,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
    created.push({ type: "club", id, latStr: g.latStr, lonStr: g.lonStr, postCode: "CV1 1AA" });
  }

  console.log("Creating routes…");
  for (let i = r.from; i <= r.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const fac = corridorFacilitySlices(i);
    const id = uuidv4();
    await db.send(
      new PutCommand({
        TableName: TABLES.opportunityRoutes,
        Item: {
          id,
          name: `${NAME_PREFIX} Route ${i + 1}`,
          description: `Seeded walk ${i + 1} along London–Manchester corridor.`,
          themeSlug: ROUTE_THEMES[i % ROUTE_THEMES.length],
          routeTypeSlug: i % 2 === 0 ? "circular" : "linear",
          routeDistanceMiles: 1 + (i % 8) * 0.5,
          difficultyRatingSlug: "easy",
          activityGroupSlug: "energy_burner",
          postCode: "LE1 1AA",
          latitude: g.latStr,
          longitude: g.lonStr,
          startPointPostCode: "LE1 1AA",
          parkingProvisionSlug: "free_car_park",
          venueSettingSlug: "outside",
          adultCost: 0,
          childCost: 0,
          infantCost: 0,
          interestTags: INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length],
          routeSuitabilitySlugs: ["buggy", "carriers"],
          terrainTypeSlugs: ["undulating"],
          generalFacilitySlugs: fac.general,
          kidsFacilitySlugs: fac.kids,
          parentFacilitySlugs: fac.parent,
          dogFacilitySlugs: fac.dog,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
    created.push({ type: "route", id, latStr: g.latStr, lonStr: g.lonStr, postCode: "LE1 1AA" });
  }

  console.log("Creating driving legs (synthetic metrics from crow distance)…");
  for (const item of created) {
    await createDrivingLeg({
      parentId,
      parentPostCode: "SW1A1AA",
      parentLat: parentLatStr,
      parentLon: parentLonStr,
      opportunityType: item.type,
      opportunityId: item.id,
      oppPostCode: item.postCode,
      oppLat: item.latStr,
      oppLon: item.lonStr,
    });
  }

  console.log("\nDone.");
  console.log(`  Opportunities: ${created.length} (venues ${COUNTS.venues}, events ${COUNTS.events}, clubs ${COUNTS.clubs}, routes ${COUNTS.routes})`);
  console.log(`  Demo parent id: ${parentId}`);
  console.log(`  Demo child id:  ${childId}`);
  console.log(`  Demo user:      ${DEMO_USER_EMAIL}`);
  console.log("\nSwagger: GET /api/search/opportunities");
  console.log(
    `  Example: ?parentId=${parentId}&interestSubCategorySlug=nature_wildlife&maxTimeToReachMinutes=600&maxDistanceMiles=500`,
  );
  console.log(
    `  With child: &childId=${childId} — use interestSubCategorySlug=animal_encounters`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
