/**
 * ~50 opportunities (venues, events, clubs, routes) along London → Manchester with lat/long,
 * interest categories/subcategories (idempotent), a demo parent + child, and driving legs for
 * GET /api/search/opportunities in Swagger.
 *
 * Run: `npm run seed:swagger-corridor`
 */
import "dotenv/config";
import type { OpportunityRecordType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import {
  seedInterestCategories,
  seedInterestSubCategories,
} from "./seed_interests.js";
import { FACILITY_ROWS, seedFacilities } from "./seed_facilities.js";

const prisma = new PrismaClient();

const NAME_PREFIX = "Corridor Seed";

const LONDON = { lat: 51.507351, lon: -0.127758 };
const MANCHESTER = { lat: 53.480759, lon: -2.242631 };

const DEMO_USER_EMAIL = "swagger-corridor-parent@example.com";
const DEMO_USER_SUB = "swagger-corridor-parent-sub";
const DEMO_CHILD_NAME = "Swagger Corridor Child";

/** Root interest subcategory slugs to rotate on opportunities (must exist after seed_interests). */
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

/** Facility slug sets from `seed_facilities` / `FACILITY_ROWS`, rotated by corridor index. */
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

function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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

function corridorGeo(index: number, total: number): {
  latStr: string;
  lonStr: string;
  latNum: number;
  lonNum: number;
} {
  const t = total <= 1 ? 0 : index / (total - 1);
  const latNum = LONDON.lat + t * (MANCHESTER.lat - LONDON.lat);
  const lonNum = LONDON.lon + t * (MANCHESTER.lon - LONDON.lon);
  return {
    latStr: coordKey(latNum),
    lonStr: coordKey(lonNum),
    latNum,
    lonNum,
  };
}

function syntheticDrivingFromCrowMiles(crowMiles: number): {
  drivingDistanceMeters: number;
  drivingDurationSeconds: number;
} {
  const crowMeters = crowMiles * 1609.344;
  const drivingMeters = Math.max(200, Math.round(crowMeters * 1.22));
  const durationSeconds = Math.max(120, Math.round(drivingMeters / 14));
  return {
    drivingDistanceMeters: drivingMeters,
    drivingDurationSeconds: durationSeconds,
  };
}

async function deletePriorCorridorData() {
  const prefix = NAME_PREFIX;

  const [venues, events, clubs, routes] = await Promise.all([
    prisma.opportunityVenue.findMany({
      where: { name: { startsWith: prefix } },
      select: { id: true },
    }),
    prisma.opportunityEvent.findMany({
      where: { name: { startsWith: prefix } },
      select: { id: true },
    }),
    prisma.opportunityClub.findMany({
      where: { name: { startsWith: prefix } },
      select: { id: true },
    }),
    prisma.opportunityRoute.findMany({
      where: { name: { startsWith: prefix } },
      select: { id: true },
    }),
  ]);

  for (const v of venues) {
    await prisma.wishlistItem.deleteMany({ where: { opportunityVenueId: v.id } });
  }
  for (const e of events) {
    await prisma.wishlistItem.deleteMany({ where: { opportunityEventId: e.id } });
  }
  for (const c of clubs) {
    await prisma.wishlistItem.deleteMany({ where: { opportunityClubId: c.id } });
  }
  for (const r of routes) {
    await prisma.wishlistItem.deleteMany({ where: { opportunityRouteId: r.id } });
  }

  const oppFilters = [
    ...venues.map((x) => ({ opportunityType: "venue" as const, opportunityId: x.id })),
    ...events.map((x) => ({ opportunityType: "event" as const, opportunityId: x.id })),
    ...clubs.map((x) => ({ opportunityType: "club" as const, opportunityId: x.id })),
    ...routes.map((x) => ({ opportunityType: "route" as const, opportunityId: x.id })),
  ];

  if (oppFilters.length > 0) {
    await prisma.parentOpportunityDrivingLeg.deleteMany({
      where: { OR: oppFilters },
    });
  }

  await prisma.opportunityVenue.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.opportunityEvent.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.opportunityClub.deleteMany({ where: { name: { startsWith: prefix } } });
  await prisma.opportunityRoute.deleteMany({ where: { name: { startsWith: prefix } } });
}

async function rootSubcategoryId(categorySlug: string, subSlug: string): Promise<string> {
  const cat = await prisma.interestCategory.findUnique({ where: { slug: categorySlug } });
  if (!cat) throw new Error(`Missing interest category "${categorySlug}" — run seed_interests first.`);
  const sub = await prisma.interestSubCategory.findFirst({
    where: { categoryId: cat.id, slug: subSlug, parentId: null },
  });
  if (!sub) {
    throw new Error(`Missing root subcategory "${subSlug}" under "${categorySlug}".`);
  }
  return sub.id;
}

async function upsertDemoParentWithChild(input: {
  parentLat: string;
  parentLon: string;
  postCode: string;
}): Promise<{ parentId: string; childId: string }> {
  const natureCat = await prisma.interestCategory.findUnique({
    where: { slug: "nature_exploration" },
  });
  const learningCat = await prisma.interestCategory.findUnique({
    where: { slug: "learning_curiosity" },
  });
  if (!natureCat || !learningCat) {
    throw new Error("Expected nature_exploration and learning_curiosity categories.");
  }

  const subNatureWildlife = await rootSubcategoryId("nature_exploration", "nature_wildlife");
  const subAnimalEncounters = await rootSubcategoryId("learning_curiosity", "animal_encounters");

  const user = await prisma.users.upsert({
    where: { email: DEMO_USER_EMAIL },
    create: {
      email: DEMO_USER_EMAIL,
      sub: DEMO_USER_SUB,
      role: "PARENT",
    },
    update: {},
  });

  const parent = await prisma.parents.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      postCode: input.postCode,
      firstNameOrNickName: "Swagger Corridor Parent",
      latitude: input.parentLat,
      longitude: input.parentLon,
      searchRadius: 400,
      interestCategories: { connect: [{ id: natureCat.id }] },
      interestSubCategories: { connect: [{ id: subNatureWildlife }] },
    },
    update: {
      postCode: input.postCode,
      firstNameOrNickName: "Swagger Corridor Parent",
      latitude: input.parentLat,
      longitude: input.parentLon,
      searchRadius: 400,
      interestCategories: { set: [{ id: natureCat.id }] },
      interestSubCategories: { set: [{ id: subNatureWildlife }] },
    },
  });

  let child = await prisma.children.findFirst({
    where: { parentId: parent.id, nameOrNickName: DEMO_CHILD_NAME },
  });
  if (child) {
    child = await prisma.children.update({
      where: { id: child.id },
      data: {
        dateOfBirth: new Date("2019-04-10"),
        interestCategories: { set: [{ id: learningCat.id }] },
        interestSubCategories: { set: [{ id: subAnimalEncounters }] },
      },
    });
  } else {
    child = await prisma.children.create({
      data: {
        parentId: parent.id,
        nameOrNickName: DEMO_CHILD_NAME,
        dateOfBirth: new Date("2019-04-10"),
        interestCategories: { connect: [{ id: learningCat.id }] },
        interestSubCategories: { connect: [{ id: subAnimalEncounters }] },
      },
    });
  }

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
  const pLat = Number.parseFloat(input.parentLat);
  const pLon = Number.parseFloat(input.parentLon);
  const oLat = Number.parseFloat(input.oppLat);
  const oLon = Number.parseFloat(input.oppLon);
  const crow = haversineDistanceMiles(pLat, pLon, oLat, oLon);
  const { drivingDistanceMeters, drivingDurationSeconds } = syntheticDrivingFromCrowMiles(crow);

  await prisma.parentOpportunityDrivingLeg.upsert({
    where: {
      parentId_opportunityType_opportunityId: {
        parentId: input.parentId,
        opportunityType: input.opportunityType,
        opportunityId: input.opportunityId,
      },
    },
    create: {
      parentId: input.parentId,
      opportunityType: input.opportunityType,
      opportunityId: input.opportunityId,
      parentPostCode: input.parentPostCode,
      parentLatitude: input.parentLat,
      parentLongitude: input.parentLon,
      opportunityPostCode: input.oppPostCode?.trim() || null,
      opportunityLatitude: input.oppLat,
      opportunityLongitude: input.oppLon,
      drivingDistanceMeters,
      drivingDurationSeconds,
    },
    update: {
      parentPostCode: input.parentPostCode,
      parentLatitude: input.parentLat,
      parentLongitude: input.parentLon,
      opportunityPostCode: input.oppPostCode?.trim() || null,
      opportunityLatitude: input.oppLat,
      opportunityLongitude: input.oppLon,
      drivingDistanceMeters,
      drivingDurationSeconds,
    },
  });
}

const TOTAL_POINTS = 50;
/** 13 + 12 + 13 + 12 = 50 */
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
  await seedInterestCategories(prisma);
  await seedInterestSubCategories(prisma);

  console.log("Seeding facilities (from seed_facilities)…");
  await seedFacilities(prisma);

  const parentLatStr = coordKey(LONDON.lat);
  const parentLonStr = coordKey(LONDON.lon);
  const { parentId, childId } = await upsertDemoParentWithChild({
    parentLat: parentLatStr,
    parentLon: parentLonStr,
    postCode: "SW1A 1AA",
  });

  console.log("Removing prior corridor seed opportunities & legs…");
  await deletePriorCorridorData();

  const { v, e, c, r } = indexRanges();
  const created: {
    type: OpportunityRecordType;
    id: string;
    latStr: string;
    lonStr: string;
    postCode: string | null;
  }[] = [];

  console.log("Creating venues…");
  for (let i = v.from; i <= v.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const tag = INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length];
    const theme = VENUE_THEMES[i % VENUE_THEMES.length];
    const fac = corridorFacilitySlices(i);
    const row = await prisma.opportunityVenue.create({
      data: {
        name: `${NAME_PREFIX} Venue ${i + 1}`,
        description: `Seeded venue ${i + 1} along London–Manchester corridor.`,
        postCode: "M1 1AE",
        latitude: g.latStr,
        longitude: g.lonStr,
        venuePostcode: "M1 1AE",
        themeSlug: theme,
        themeVariantSlug: "animal_parks_and_zoos",
        activityGroupSlug: "special_day_out",
        terrainTypeSlug: "flat",
        venueSettingSlug: "outside",
        parkingProvisionSlug: "free_car_park",
        adultCost: 10 + (i % 5),
        childCost: 6,
        infantCost: 0,
        interestTags: tag,
        ageSuitabilitySlugs: ["age_3", "age_4", "age_5", "age_6", "age_7", "age_8"],
        generalFacilitySlugs: fac.general,
        kidsFacilitySlugs: fac.kids,
        parentFacilitySlugs: fac.parent,
        dogFacilitySlugs: fac.dog,
      },
    });
    created.push({
      type: "venue",
      id: row.id,
      latStr: g.latStr,
      lonStr: g.lonStr,
      postCode: row.postCode,
    });
  }

  console.log("Creating events…");
  for (let i = e.from; i <= e.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const tag = INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length];
    const theme = EVENT_THEMES[i % EVENT_THEMES.length];
    const evType = EVENT_TYPES[i % EVENT_TYPES.length];
    const fac = corridorFacilitySlices(i);
    const row = await prisma.opportunityEvent.create({
      data: {
        name: `${NAME_PREFIX} Event ${i + 1}`,
        description: `Seeded event ${i + 1} along London–Manchester corridor.`,
        themeSlug: theme,
        eventTypeSlug: evType,
        activityGroupSlug: "low_effort",
        postCode: "B1 1AA",
        latitude: g.latStr,
        longitude: g.lonStr,
        venuePostCode: "B1 1AA",
        startDate: new Date(`2026-${String((i % 6) + 5).padStart(2, "0")}-15`),
        startTime: "10:00",
        finishTime: "14:00",
        venueSettingSlug: "outside",
        adultCost: 0,
        childCost: 5,
        infantCost: 0,
        interestTags: tag,
        ageSuitabilitySlugs: ["age_5", "age_6", "age_7", "age_8"],
        generalFacilitySlugs: fac.general,
        kidsFacilitySlugs: fac.kids,
        parentFacilitySlugs: fac.parent,
      },
    });
    created.push({
      type: "event",
      id: row.id,
      latStr: g.latStr,
      lonStr: g.lonStr,
      postCode: row.postCode,
    });
  }

  console.log("Creating clubs…");
  for (let i = c.from; i <= c.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const tag = INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length];
    const theme = CLUB_THEMES[i % CLUB_THEMES.length];
    const day = DAYS[i % DAYS.length];
    const fac = corridorFacilitySlices(i);
    const row = await prisma.opportunityClub.create({
      data: {
        name: `${NAME_PREFIX} Club ${i + 1}`,
        description: `Seeded club ${i + 1} along London–Manchester corridor.`,
        themeSlug: theme,
        themeVariantSlug: "forest_school",
        postCode: "CV1 1AA",
        latitude: g.latStr,
        longitude: g.lonStr,
        venuePostCode: "CV1 1AA",
        dayOfWeekSlug: day,
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
        interestTags: tag,
        ageSuitabilitySlugs: ["age_2", "age_3", "age_4", "age_5"],
        generalFacilitySlugs: fac.general,
        kidsFacilitySlugs: fac.kids,
        parentFacilitySlugs: fac.parent,
      },
    });
    created.push({
      type: "club",
      id: row.id,
      latStr: g.latStr,
      lonStr: g.lonStr,
      postCode: row.postCode,
    });
  }

  console.log("Creating routes…");
  for (let i = r.from; i <= r.to; i++) {
    const g = corridorGeo(i, TOTAL_POINTS);
    const tag = INTEREST_TAG_ROTATION[i % INTEREST_TAG_ROTATION.length];
    const theme = ROUTE_THEMES[i % ROUTE_THEMES.length];
    const fac = corridorFacilitySlices(i);
    const row = await prisma.opportunityRoute.create({
      data: {
        name: `${NAME_PREFIX} Route ${i + 1}`,
        description: `Seeded walk ${i + 1} along London–Manchester corridor.`,
        themeSlug: theme,
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
        interestTags: tag,
        routeSuitabilitySlugs: ["buggy", "carriers"],
        terrainTypeSlugs: ["undulating"],
        generalFacilitySlugs: fac.general,
        kidsFacilitySlugs: fac.kids,
        parentFacilitySlugs: fac.parent,
        dogFacilitySlugs: fac.dog,
      },
    });
    created.push({
      type: "route",
      id: row.id,
      latStr: g.latStr,
      lonStr: g.lonStr,
      postCode: row.postCode,
    });
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
  console.log(
    `  Facility filter: &facility=toilets | play_equipment | dog_bins (see GET /api/facilities)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
