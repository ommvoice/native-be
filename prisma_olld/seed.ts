import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  seedInterestCategories,
  seedInterestSubCategories,
} from "./seed_interests.js";
import { seedInterestBasedSkills } from "./seed_skills.js";
import { seedFacilities } from "./seed_facilities.js";

const prisma = new PrismaClient();

/** Postcodes within ~50 miles of HP2 7DB (Hemel Hempstead), with WGS84 from postcodes.io. */
const SEED_NEAR_HP2 = {
  venue: {
    postCode: "HP3 8JG",
    latitude: "51.73951",
    longitude: "-0.446281",
  },
  event: {
    postCode: "HP4 1AB",
    latitude: "51.761548",
    longitude: "-0.568634",
  },
  club: {
    postCode: "WD17 1NA",
    latitude: "51.659461",
    longitude: "-0.401221",
  },
  route: {
    postCode: "LU1 1AA",
    latitude: "51.879985",
    longitude: "-0.422902",
  },
} as const;

function slugToName(slug: string): string {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Empty skill / interest tables (e.g. before a dedicated seed runs later). */
async function clearSkillsAndInterests() {
  await prisma.skill.deleteMany();
  await prisma.interestSubCategory.deleteMany();
  await prisma.interestCategory.deleteMany();
  await prisma.skillLevel.deleteMany();
}

async function seedOpportunityEvents() {
  await prisma.opportunityEvent.deleteMany();

  await prisma.opportunityEvent.create({
    data: {
      name: "Gone Wild",
      description: "A family festival known for outdoors focused events and activities.",
      themeSlug: "a_big_day_out",
      themeVariantSlug: "seasonal_and_themed_events",
      eventTypeSlug: "festival",
      activityGroupSlug: "special_day_out",
      startDate: new Date("2026-06-22"),
      endDate: new Date("2026-06-23"),
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
      generalFacilitySlugs: [
        "toilets",
        "showers_changing",
        "picnic_benches",
        "outdoor_seating",
      ],
      kidsFacilitySlugs: ["activity_trail"],
      parentFacilitySlugs: [],
      ageSuitabilitySlugs: [
        "age_5",
        "age_6",
        "age_7",
        "age_8",
        "age_9",
        "age_10",
        "age_11",
        "age_12",
        "age_13_plus",
        "age_16_plus",
      ],
      extraKitSlugs: ["wellies", "headtorch", "camping_gear"],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: [
        "live_shows_or_performances",
        "large_interactive_exhibits",
        "meet_and_greet_characters",
        "hands_on_activities",
        "challenges_or_missions",
      ],
    },
  });
}

async function seedOpportunityVenues() {
  await prisma.opportunityVenue.deleteMany();

  await prisma.opportunityVenue.create({
    data: {
      name: "World of Country Life",
      description:
        "World of Country Life is a mix of farm experiences, museums, and play areas. Open seasonally, it features animal petting, fun daily shows, a deer train safari, and extensive indoor/outdoor play areas, offering a varied and mixed-pace day out.",
      postCode: SEED_NEAR_HP2.venue.postCode,
      latitude: SEED_NEAR_HP2.venue.latitude,
      longitude: SEED_NEAR_HP2.venue.longitude,
      venuePostcode: SEED_NEAR_HP2.venue.postCode,
      openingDaysAndTimes:
        "Monday 10am–5pm, Tuesday 10am–5pm, Wednesday 10am–5pm, Thursday 10am–5pm, Friday 10am–5pm, Saturday 10am–5pm, Sunday 10am–5pm",
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
      generalFacilitySlugs: [
        "toilets",
        "disabled_toilets",
        "baby_changing",
        "benches",
        "picnic_benches",
        "indoor_seating",
        "outdoor_seating",
      ],
      kidsFacilitySlugs: ["childrens_trail", "play_equipment"],
      parentFacilitySlugs: ["hot_drinks", "hot_cold_food", "snacks"],
      dogFacilitySlugs: ["lead_only", "dog_bins"],
      ageSuitabilitySlugs: [
        "under_1",
        "age_1",
        "age_2",
        "age_3",
        "age_4",
        "age_5",
        "age_6",
        "age_7",
        "age_8",
        "age_9",
      ],
      extraKitSlugs: ["pram_buggy_road", "sling_baby_carrier"],
      seasonalHighlightSlugs: ["baby_lambs"],
      highlightAttractionSlugs: [
        "hands_on_petting",
        "animal_feeding",
        "keeper_talks",
        "tractor_rides",
        "animal_races",
        "animal_displays_or_shows",
      ],
    },
  });
}

// ── Main ──

async function main() {
  console.log("Clearing skills and interest tables...");
  await clearSkillsAndInterests();

  console.log("Seeding interest categories...");
  await seedInterestCategories(prisma);
  console.log("Seeding interest subcategories...");
  await seedInterestSubCategories(prisma);

  console.log("Seeding interest-based skills...");
  await seedInterestBasedSkills(prisma);

  console.log("Seeding facilities...");
  await seedFacilities(prisma);

  console.log("Seeding opportunity events...");
  await seedOpportunityEvents();

  const events = await prisma.opportunityEvent.findMany();
  console.log(`Seeded ${events.length} opportunity events:`);
  for (const e of events) {
    console.log(
      `  ${e.name} (${e.eventTypeSlug}) — theme ${e.themeSlug} / variant ${e.themeVariantSlug ?? "—"} / activity ${e.activityGroupSlug ?? "—"} / parking ${e.parkingProvisionSlug ?? "—"}`,
    );
  }

  console.log("\nSeeding opportunity venues...");
  await seedOpportunityVenues();

  const venues = await prisma.opportunityVenue.findMany();
  console.log(`Seeded ${venues.length} opportunity venues:`);
  for (const v of venues) {
    console.log(
      `  ${v.name} — ${slugToName(v.themeSlug)} / ${v.themeVariantSlug ? slugToName(v.themeVariantSlug) : "—"}`,
    );
  }

  console.log("\nSeeding opportunity clubs...");
  await seedOpportunityClubs();

  const clubs = await prisma.opportunityClub.findMany();
  console.log(`Seeded ${clubs.length} opportunity clubs:`);
  for (const c of clubs) {
    console.log(
      `  ${c.name} — ${slugToName(c.themeSlug)} / ${c.themeVariantSlug ? slugToName(c.themeVariantSlug) : "—"} (${c.dayOfWeekSlug ? slugToName(c.dayOfWeekSlug) : "—"})`,
    );
  }

  console.log("\nSeeding opportunity routes...");
  await seedOpportunityRoutes();

  const routes = await prisma.opportunityRoute.findMany();
  console.log(`Seeded ${routes.length} opportunity routes:`);
  for (const r of routes) {
    console.log(
      `  ${r.name} — ${slugToName(r.themeSlug)} / ${r.themeVariantSlug ? slugToName(r.themeVariantSlug) : "—"} (${r.routeTypeSlug ? slugToName(r.routeTypeSlug) : "—"})`,
    );
  }

  console.log("\nSeeding wishlists...");
  await seedWishlists();
}

async function seedOpportunityClubs() {
  await prisma.opportunityClub.deleteMany();

  await prisma.opportunityClub.create({
    data: {
      name: "Little Muddy Boots",
      description:
        "Come and get messy, learn new skills and connect in our woodland setting.",
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
      seasonalHighlightSlugs: [
        "autumn_colours",
        "autumn_pony_drifts",
        "autumn_leaves",
      ],
      highlightAttractionSlugs: [
        "mud_kitchens",
        "forest_school_activities",
        "immersive_natural_surroundings",
        "quiet_or_low_intervention_spaces",
      ],
    },
  });
}

/** Use an existing parent+child if any; otherwise create a demo user chain so wishlists can reference real FKs. */
async function ensureParentChildForWishlistSeed(): Promise<{
  parentId: string;
  childId: string;
}> {
  const parentWithChild = await prisma.parents.findFirst({
    where: { children: { some: {} } },
    include: {
      children: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });
  if (parentWithChild?.children[0]) {
    return {
      parentId: parentWithChild.id,
      childId: parentWithChild.children[0].id,
    };
  }

  const demoEmail = "seed-wishlist-demo@example.com";
  const user = await prisma.users.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      sub: "seed-wishlist-demo-sub",
      role: "PARENT",
    },
    update: {},
  });

  let parent = await prisma.parents.findUnique({
    where: { userId: user.id },
  });
  if (!parent) {
    parent = await prisma.parents.create({
      data: {
        userId: user.id,
        postCode: "EX1 1AA",
        firstNameOrNickName: "Seed Parent",
        latitude: "50.7",
        longitude: "-3.5",
        searchRadius: 10,
      },
    });
  }

  const existingChild = await prisma.children.findFirst({
    where: { parentId: parent.id },
  });
  if (existingChild) {
    return { parentId: parent.id, childId: existingChild.id };
  }

  const child = await prisma.children.create({
    data: {
      parentId: parent.id,
      nameOrNickName: "Seed Child",
      dateOfBirth: new Date("2020-01-15"),
    },
  });
  return { parentId: parent.id, childId: child.id };
}

async function seedWishlists() {
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();

  const venue = await prisma.opportunityVenue.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const event = await prisma.opportunityEvent.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const club = await prisma.opportunityClub.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const route = await prisma.opportunityRoute.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!venue || !event || !club || !route) {
    console.log(
      "Skipping wishlist seed: need at least one venue, event, club, and route.",
    );
    return;
  }

  const { parentId, childId } = await ensureParentChildForWishlistSeed();

  await prisma.wishlist.create({
    data: {
      name: "Family weekend picks",
      color: "#6366f1",
      parentId,
      childId,
      items: {
        create: [
          { opportunityVenueId: venue.id },
          { opportunityEventId: event.id },
          { opportunityClubId: club.id },
          { opportunityRouteId: route.id },
        ],
      },
    },
  });

  console.log(
    `Seeded 1 wishlist with 4 items (parent ${parentId}, child ${childId}).`,
  );
}

async function seedOpportunityRoutes() {
  await prisma.opportunityRoute.deleteMany();

  await prisma.opportunityRoute.create({
    data: {
      name: "Woodbury Castle",
      description:
        "A short circular walk over the healthland of Woodbury. Great views, sturdy trails & gorseland.",
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
      interestTags:
        "Panoramic views, Elevated viewpoints, Wildlife spotting",
      seasonalTagSlug: "autumn",
      routeSuitabilitySlugs: [
        "bikes",
        "buggy",
        "mountain_bikes",
        "carriers",
        "xc_buggies",
      ],
      terrainTypeSlugs: ["undulating", "rocky", "uneven"],
      generalFacilitySlugs: ["picnic_benches"],
      dogFacilitySlugs: ["dog_bins", "lead_only"],
      extraKitSlugs: ["xc_buggy", "sling_baby_carrier", "sturdy_footwear"],
      seasonalHighlightSlugs: ["autumn_pony_drifts", "autumn_leaves"],
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
