/// <reference types="node" />
import "dotenv/config";
import { DeleteCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../api/database/database.config.js";
import { TABLES } from "../api/database/tables.js";

/** Postcodes within ~50 miles of HP2 7DB (Hemel Hempstead), with WGS84 from postcodes.io. */
const SEED_NEAR_HP2 = {
  venue: { postCode: "HP3 8JG", latitude: "51.73951", longitude: "-0.446281" },
  event: { postCode: "HP4 1AB", latitude: "51.761548", longitude: "-0.568634" },
  club:  { postCode: "WD17 1NA", latitude: "51.659461", longitude: "-0.401221" },
  route: { postCode: "LU1 1AA", latitude: "51.879985", longitude: "-0.422902" },
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function clearTable(tableName: string) {
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new ScanCommand({ TableName: tableName, ProjectionExpression: "id", ...(lastKey ? { ExclusiveStartKey: lastKey } : {}) }),
    );
    for (const item of res.Items ?? []) {
      await db.send(new DeleteCommand({ TableName: tableName, Key: { id: item.id } }));
    }
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
}

async function scanFirst(tableName: string): Promise<Record<string, unknown> | null> {
  const res = await db.send(new ScanCommand({ TableName: tableName, Limit: 1 }));
  return (res.Items?.[0] as Record<string, unknown>) ?? null;
}

async function queryFirst(
  tableName: string,
  indexName: string,
  keyName: string,
  keyValue: string,
): Promise<Record<string, unknown> | null> {
  const res = await db.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: `${keyName} = :v`,
      ExpressionAttributeValues: { ":v": keyValue },
      Limit: 1,
    }),
  );
  return (res.Items?.[0] as Record<string, unknown>) ?? null;
}

// ── Opportunities ─────────────────────────────────────────────────────────────

async function seedOpportunityEvents() {
  await clearTable(TABLES.opportunityEvents);
  const now = new Date().toISOString();

  await db.send(new PutCommand({
    TableName: TABLES.opportunityEvents,
    Item: {
      id: uuidv4(),
      name: "Gone Wild",
      description: "A family festival known for outdoors focused events and activities.",
      themeSlug: "a_big_day_out",
      themeVariantSlug: "seasonal_and_themed_events",
      eventTypeSlug: "festival",
      activityGroupSlug: "special_day_out",
      startDate: "2026-06-22",
      endDate: "2026-06-23",
      startTime: "09:00",
      finishTime: "21:00",
      postCode: SEED_NEAR_HP2.event.postCode,
      latitude: SEED_NEAR_HP2.event.latitude,
      longitude: SEED_NEAR_HP2.event.longitude,
      venuePostCode: SEED_NEAR_HP2.event.postCode,
      parkingProvisionSlug: "paid_car_park",
      venueSettingSlug: "outside",
      adultCost: 30,
      childCost: 20,
      infantCost: 5,
      seasonalTagSlug: "summer",
      generalFacilitySlugs: ["toilets", "showers_changing", "picnic_benches", "outdoor_seating"],
      kidsFacilitySlugs: ["activity_trail"],
      parentFacilitySlugs: [],
      ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8", "age_9", "age_10", "age_11", "age_12", "age_13_plus", "age_16_plus"],
      extraKitSlugs: ["wellies", "headtorch", "camping_gear"],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: ["live_shows_or_performances", "large_interactive_exhibits", "meet_and_greet_characters", "hands_on_activities", "challenges_or_missions"],
      createdAt: now,
      updatedAt: now,
    },
  }));
  console.log("  Seeded 1 opportunity event (Gone Wild).");
}

async function seedOpportunityVenues() {
  await clearTable(TABLES.opportunityVenues);
  const now = new Date().toISOString();

  await db.send(new PutCommand({
    TableName: TABLES.opportunityVenues,
    Item: {
      id: uuidv4(),
      name: "World of Country Life",
      description: "World of Country Life is a mix of farm experiences, museums, and play areas. Open seasonally, it features animal petting, fun daily shows, a deer train safari, and extensive indoor/outdoor play areas, offering a varied and mixed-pace day out.",
      postCode: SEED_NEAR_HP2.venue.postCode,
      latitude: SEED_NEAR_HP2.venue.latitude,
      longitude: SEED_NEAR_HP2.venue.longitude,
      venuePostcode: SEED_NEAR_HP2.venue.postCode,
      openingDaysAndTimes: "Monday 10am–5pm, Tuesday 10am–5pm, Wednesday 10am–5pm, Thursday 10am–5pm, Friday 10am–5pm, Saturday 10am–5pm, Sunday 10am–5pm",
      openingExclusions: "December, January, February",
      themeSlug: "animal_encounters",
      themeVariantSlug: "animal_parks_and_zoos",
      activityGroupSlug: "special_day_out",
      terrainTypeSlug: "flat",
      venueSettingSlug: "outside",
      parkingProvisionSlug: "paid_car_park",
      adultCost: 20,
      childCost: 12,
      infantCost: 3,
      estimatedTimeToSpend: "2-3hrs",
      seasonalTagSlug: "easter",
      generalFacilitySlugs: ["toilets", "disabled_toilets", "baby_changing", "benches", "picnic_benches", "indoor_seating", "outdoor_seating"],
      kidsFacilitySlugs: ["childrens_trail", "play_equipment"],
      parentFacilitySlugs: ["hot_drinks", "hot_cold_food", "snacks"],
      dogFacilitySlugs: ["lead_only", "dog_bins"],
      ageSuitabilitySlugs: ["under_1", "age_1", "age_2", "age_3", "age_4", "age_5", "age_6", "age_7", "age_8", "age_9"],
      extraKitSlugs: ["pram_buggy_road", "sling_baby_carrier"],
      seasonalHighlightSlugs: ["baby_lambs"],
      highlightAttractionSlugs: ["hands_on_petting", "animal_feeding", "keeper_talks", "tractor_rides", "animal_races", "animal_displays_or_shows"],
      createdAt: now,
      updatedAt: now,
    },
  }));
  console.log("  Seeded 1 opportunity venue (World of Country Life).");
}

async function seedOpportunityClubs() {
  await clearTable(TABLES.opportunityClubs);
  const now = new Date().toISOString();

  await db.send(new PutCommand({
    TableName: TABLES.opportunityClubs,
    Item: {
      id: uuidv4(),
      name: "Little Muddy Boots",
      description: "Come and get messy, learn new skills and connect in our woodland setting.",
      themeSlug: "nature_and_wildlife_exploration",
      themeVariantSlug: "forest_school",
      postCode: SEED_NEAR_HP2.club.postCode,
      latitude: SEED_NEAR_HP2.club.latitude,
      longitude: SEED_NEAR_HP2.club.longitude,
      venuePostCode: SEED_NEAR_HP2.club.postCode,
      dayOfWeekSlug: "monday",
      startTime: "09:00",
      finishTime: "10:00",
      activityGroupSlug: "low_effort",
      clubFormatSlug: "stay_and_play_supervised",
      clubFrequencySlug: "weekly",
      commitmentSlug: "termly_blocks",
      skillAreaSlug: "outdoors_and_nature",
      skillAreaVariant: "Forest School",
      abilityLevelSlug: "novice",
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "outside",
      adultCost: 10,
      childCost: 5,
      infantCost: 0,
      ageSuitabilitySlugs: ["age_2", "age_3", "age_4", "age_5"],
      generalFacilitySlugs: ["toilets", "outdoor_seating"],
      kidsFacilitySlugs: ["play_equipment"],
      parentFacilitySlugs: ["drinks_stand", "clear_sightlines"],
      extraKitSlugs: ["wellies"],
      seasonalHighlightSlugs: ["autumn_colours", "autumn_pony_drifts", "autumn_leaves"],
      highlightAttractionSlugs: ["mud_kitchens", "forest_school_activities", "immersive_natural_surroundings", "quiet_or_low_intervention_spaces"],
      createdAt: now,
      updatedAt: now,
    },
  }));
  console.log("  Seeded 1 opportunity club (Little Muddy Boots).");
}

async function seedOpportunityRoutes() {
  await clearTable(TABLES.opportunityRoutes);
  const now = new Date().toISOString();

  await db.send(new PutCommand({
    TableName: TABLES.opportunityRoutes,
    Item: {
      id: uuidv4(),
      name: "Woodbury Castle",
      description: "A short circular walk over the healthland of Woodbury. Great views, sturdy trails & gorseland.",
      themeSlug: "scenic_walks_and_wanders",
      themeVariantSlug: "woodland_and_forest_walks",
      routeTypeSlug: "circular",
      routeDistanceMiles: 0.8,
      difficultyRatingSlug: "easy",
      activityGroupSlug: "energy_burner",
      postCode: SEED_NEAR_HP2.route.postCode,
      latitude: SEED_NEAR_HP2.route.latitude,
      longitude: SEED_NEAR_HP2.route.longitude,
      startPointPostCode: SEED_NEAR_HP2.route.postCode,
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "outside",
      adultCost: 0,
      childCost: 0,
      infantCost: 0,
      interestTags: "Panoramic views, Elevated viewpoints, Wildlife spotting",
      seasonalTagSlug: "autumn",
      routeSuitabilitySlugs: ["bikes", "buggy", "mountain_bikes", "carriers", "xc_buggies"],
      terrainTypeSlugs: ["undulating", "rocky", "uneven"],
      generalFacilitySlugs: ["picnic_benches"],
      dogFacilitySlugs: ["dog_bins", "lead_only"],
      extraKitSlugs: ["xc_buggy", "sling_baby_carrier", "sturdy_footwear"],
      seasonalHighlightSlugs: ["autumn_pony_drifts", "autumn_leaves"],
      createdAt: now,
      updatedAt: now,
    },
  }));
  console.log("  Seeded 1 opportunity route (Woodbury Castle).");
}

// ── Wishlist with demo user ───────────────────────────────────────────────────

const WISHLIST_DEMO_EMAIL = "seed-wishlist-demo@example.com";
const WISHLIST_DEMO_SUB   = "seed-wishlist-demo-sub";

async function ensureParentChildForWishlistSeed(): Promise<{ parentId: string; childId: string }> {
  const now = new Date().toISOString();

  // User
  let user = await queryFirst(TABLES.users, "email-index", "email", WISHLIST_DEMO_EMAIL);
  if (!user) {
    const id = uuidv4();
    await db.send(new PutCommand({
      TableName: TABLES.users,
      Item: { id, email: WISHLIST_DEMO_EMAIL, sub: WISHLIST_DEMO_SUB, role: "PARENT", createdAt: now, updatedAt: now },
    }));
    user = { id };
  }

  // Parent
  let parent = await queryFirst(TABLES.parents, "userId-index", "userId", user.id as string);
  if (!parent) {
    const id = uuidv4();
    await db.send(new PutCommand({
      TableName: TABLES.parents,
      Item: {
        id,
        userId: user.id,
        postCode: "EX1 1AA",
        firstNameOrNickName: "Seed Parent",
        latitude: "50.7",
        longitude: "-3.5",
        searchRadius: 10,
        createdAt: now,
        updatedAt: now,
      },
    }));
    parent = { id };
  }

  // Child
  const children = await db.send(new QueryCommand({
    TableName: TABLES.children,
    IndexName: "parentId-index",
    KeyConditionExpression: "parentId = :pid",
    ExpressionAttributeValues: { ":pid": parent.id },
  }));
  let child = children.Items?.[0] as Record<string, unknown> | undefined;
  if (!child) {
    const id = uuidv4();
    await db.send(new PutCommand({
      TableName: TABLES.children,
      Item: { id, parentId: parent.id, nameOrNickName: "Seed Child", dateOfBirth: "2020-01-15", createdAt: now, updatedAt: now },
    }));
    child = { id };
  }

  return { parentId: parent.id as string, childId: child.id as string };
}

async function seedWishlists() {
  await clearTable(TABLES.wishlistItems);
  await clearTable(TABLES.wishlists);

  const [venue, event, club, route] = await Promise.all([
    scanFirst(TABLES.opportunityVenues),
    scanFirst(TABLES.opportunityEvents),
    scanFirst(TABLES.opportunityClubs),
    scanFirst(TABLES.opportunityRoutes),
  ]);

  if (!venue || !event || !club || !route) {
    console.log("  Skipping wishlist seed: need at least one venue, event, club, and route.");
    return;
  }

  const { parentId, childId } = await ensureParentChildForWishlistSeed();
  const now = new Date().toISOString();
  const wishlistId = uuidv4();

  await db.send(new PutCommand({
    TableName: TABLES.wishlists,
    Item: { id: wishlistId, name: "Family weekend picks", color: "#6366f1", parentId, childId, createdAt: now, updatedAt: now },
  }));

  const items = [
    { opportunityVenueId: venue.id as string },
    { opportunityEventId: event.id as string },
    { opportunityClubId: club.id as string },
    { opportunityRouteId: route.id as string },
  ];
  for (const item of items) {
    await db.send(new PutCommand({
      TableName: TABLES.wishlistItems,
      Item: { id: uuidv4(), wishlistId, ...item, createdAt: now, updatedAt: now },
    }));
  }

  console.log(`  Seeded 1 wishlist with 4 items (parentId: ${parentId}, childId: ${childId}).`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nSeeding opportunity events...");
  await seedOpportunityEvents();

  console.log("Seeding opportunity venues...");
  await seedOpportunityVenues();

  console.log("Seeding opportunity clubs...");
  await seedOpportunityClubs();

  console.log("Seeding opportunity routes...");
  await seedOpportunityRoutes();

  console.log("Seeding wishlists...");
  await seedWishlists();

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
