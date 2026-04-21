/**
 * Demo data for the recommendations module.
 * Depends on `npx prisma db seed` (or `seed_interests`) so interest rows exist.
 *
 * Run: `npx tsx prisma/seed_recommendations_demo.ts`
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HP2_7DB = "HP2 7DB";
const HP2_LAT = "51.773282";
const HP2_LON = "-0.434612";

/** Demo opportunities: distinct postcodes within ~50 miles of HP2 7DB (WGS84 from postcodes.io). */
const DEMO_GEO = {
  venue: { postCode: "HP1 1BB", latitude: "51.751393", longitude: "-0.471936" },
  event: { postCode: "WD3 3RX", latitude: "51.651107", longitude: "-0.431916" },
  club: { postCode: "AL2 1AF", latitude: "51.712302", longitude: "-0.300929" },
  route: { postCode: "MK40 1DY", latitude: "52.136759", longitude: "-0.478306" },
} as const;

async function requireCategory(slug: string) {
  const c = await prisma.interestCategory.findUnique({ where: { slug } });
  if (!c) throw new Error(`Run main seed first: missing interest category "${slug}"`);
  return c;
}

async function requireSubRoot(categorySlug: string, subSlug: string) {
  const cat = await requireCategory(categorySlug);
  const sub = await prisma.interestSubCategory.findFirst({
    where: { categoryId: cat.id, slug: subSlug, parentId: null },
  });
  if (!sub) {
    throw new Error(
      `Run main seed first: missing interest subcategory "${subSlug}" under "${categorySlug}"`,
    );
  }
  return sub;
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
  const user = await prisma.users.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      sub: input.sub,
      role: "PARENT",
    },
    update: {},
  });

  const categoryConnect = await Promise.all(
    input.categorySlugs.map(async (slug) => {
      const c = await requireCategory(slug);
      return { id: c.id };
    }),
  );

  const subConnect = await Promise.all(
    input.subCategoryPairs.map(async ({ categorySlug, subSlug }) => {
      const s = await requireSubRoot(categorySlug, subSlug);
      return { id: s.id };
    }),
  );

  const parent = await prisma.parents.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      postCode: HP2_7DB,
      firstNameOrNickName: input.firstName,
      latitude: HP2_LAT,
      longitude: HP2_LON,
      searchRadius: 80, // miles (UK)
      interestCategories: { connect: categoryConnect },
      interestSubCategories: { connect: subConnect },
    },
    update: {
      postCode: HP2_7DB,
      firstNameOrNickName: input.firstName,
      latitude: HP2_LAT,
      longitude: HP2_LON,
      searchRadius: 80, // miles (UK)
      interestCategories: { set: categoryConnect },
      interestSubCategories: { set: subConnect },
    },
  });

  await prisma.children.deleteMany({
    where: {
      parentId: parent.id,
      nameOrNickName: { in: input.children.map((c) => c.name) },
    },
  });

  for (const ch of input.children) {
    const chCat = await Promise.all(
      ch.categorySlugs.map(async (slug) => ({ id: (await requireCategory(slug)).id })),
    );
    const chSub = await Promise.all(
      ch.subCategoryPairs.map(async ({ categorySlug, subSlug }) => ({
        id: (await requireSubRoot(categorySlug, subSlug)).id,
      })),
    );

    await prisma.children.create({
      data: {
        parentId: parent.id,
        nameOrNickName: ch.name,
        dateOfBirth: ch.dateOfBirth,
        interestCategories: { connect: chCat },
        interestSubCategories: { connect: chSub },
      },
    });
  }

  return parent;
}

async function replaceDemoOpportunities() {
  const VENUE_NAME = "Rec Demo — Nature Barn (venue)";
  const EVENT_NAME = "Rec Demo — Wildlife Morning (event)";
  const CLUB_NAME = "Rec Demo — Tumble Tots Club";
  const ROUTE_NAME = "Rec Demo — Gade Valley Walk (route)";

  await prisma.opportunityVenue.deleteMany({
    where: { name: VENUE_NAME },
  });
  await prisma.opportunityEvent.deleteMany({
    where: { name: EVENT_NAME },
  });
  await prisma.opportunityClub.deleteMany({
    where: { name: CLUB_NAME },
  });
  await prisma.opportunityRoute.deleteMany({
    where: { name: ROUTE_NAME },
  });

  await prisma.opportunityVenue.create({
    data: {
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
    },
  });

  await prisma.opportunityEvent.create({
    data: {
      name: EVENT_NAME,
      description: "Demo event west of London; tags match learning_curiosity + animal_encounters.",
      themeSlug: "animal_encounters",
      eventTypeSlug: "family_fun_day",
      activityGroupSlug: "low_effort",
      postCode: DEMO_GEO.event.postCode,
      latitude: DEMO_GEO.event.latitude,
      longitude: DEMO_GEO.event.longitude,
      venuePostCode: DEMO_GEO.event.postCode,
      startDate: new Date("2026-05-10"),
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
    },
  });

  await prisma.opportunityClub.create({
    data: {
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
    },
  });

  await prisma.opportunityRoute.create({
    data: {
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
    },
  });
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
