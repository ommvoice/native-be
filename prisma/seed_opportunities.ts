import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── UK postcodes spread within ~60 miles of HP2 7DB ──
const LOCATIONS = {
  hemel: { postCode: "HP2 7DB", lat: "51.756910", lon: "-0.444680" },
  berkhamsted: { postCode: "HP4 1AB", lat: "51.761548", lon: "-0.568634" },
  watford: { postCode: "WD17 1NA", lat: "51.659461", lon: "-0.401221" },
  luton: { postCode: "LU1 1AA", lat: "51.879985", lon: "-0.422902" },
  stAlbans: { postCode: "AL1 1AA", lat: "51.742920", lon: "-0.341400" },
  stevenage: { postCode: "SG1 1AB", lat: "51.902000", lon: "-0.199000" },
  miltonKeynes: { postCode: "MK6 2AA", lat: "52.039000", lon: "-0.750000" },
  oxford: { postCode: "OX3 7LF", lat: "51.768000", lon: "-1.209000" },
} as const;

// ── Events ──────────────────────────────────────────────────────────────────

export async function seedOpportunityEvents(client: PrismaClient = prisma) {
  await client.opportunityEvent.deleteMany();

  const events = [
    {
      name: "Gone Wild",
      description:
        "A family festival known for outdoors focused events and activities.",
      themeSlug: "a_big_day_out",
      themeVariantSlug: "seasonal_and_themed_events",
      eventTypeSlug: "festival",
      activityGroupSlug: "special_day_out",
      startDate: new Date("2026-06-22"),
      endDate: new Date("2026-06-23"),
      startTime: "09:00",
      finishTime: "21:00",
      postCode: LOCATIONS.berkhamsted.postCode,
      latitude: LOCATIONS.berkhamsted.lat,
      longitude: LOCATIONS.berkhamsted.lon,
      venuePostCode: LOCATIONS.berkhamsted.postCode,
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
      highlightAttractionSlugs: [
        "live_shows_or_performances",
        "large_interactive_exhibits",
        "meet_and_greet_characters",
        "hands_on_activities",
        "challenges_or_missions",
      ],
    },
    {
      name: "Nature Art Day",
      description:
        "Get creative with natural materials — leaf printing, mud painting, and nature collages in a woodland setting.",
      themeSlug: "nature_and_wildlife_exploration",
      themeVariantSlug: "forest_school",
      eventTypeSlug: "workshop_or_talk",
      activityGroupSlug: "low_effort",
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-05-10"),
      startTime: "10:00",
      finishTime: "13:00",
      postCode: LOCATIONS.stAlbans.postCode,
      latitude: LOCATIONS.stAlbans.lat,
      longitude: LOCATIONS.stAlbans.lon,
      venuePostCode: LOCATIONS.stAlbans.postCode,
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "outside",
      adultCost: 12,
      childCost: 8,
      infantCost: 0,
      seasonalTagSlug: "summer",
      skillAreaSlug: "creative_arts",
      abilityLevelSlug: "novice",
      generalFacilitySlugs: ["toilets", "outdoor_seating", "picnic_benches"],
      kidsFacilitySlugs: ["activity_sheets", "activity_trail"],
      parentFacilitySlugs: ["hot_drinks", "snacks"],
      ageSuitabilitySlugs: ["age_3", "age_4", "age_5", "age_6", "age_7", "age_8"],
      extraKitSlugs: ["wellies"],
      seasonalHighlightSlugs: ["bluebells", "birdsong"],
      highlightAttractionSlugs: ["hands_on_activities", "immersive_natural_surroundings", "forest_school_activities"],
    },
    {
      name: "Family Sports Day",
      description:
        "Classic sports day fun for families — egg and spoon, sack races, relay sprints, and tug of war in the park.",
      themeSlug: "green_spaces_to_run_around",
      eventTypeSlug: "sport_based",
      activityGroupSlug: "energy_burner",
      startDate: new Date("2026-07-19"),
      endDate: new Date("2026-07-19"),
      startTime: "10:30",
      finishTime: "15:00",
      postCode: LOCATIONS.watford.postCode,
      latitude: LOCATIONS.watford.lat,
      longitude: LOCATIONS.watford.lon,
      venuePostCode: LOCATIONS.watford.postCode,
      parkingProvisionSlug: "paid_car_park",
      venueSettingSlug: "outside",
      adultCost: 5,
      childCost: 5,
      infantCost: 0,
      seasonalTagSlug: "summer",
      skillAreaSlug: "sports",
      abilityLevelSlug: "beginner",
      generalFacilitySlugs: ["toilets", "outdoor_seating", "picnic_benches"],
      kidsFacilitySlugs: ["activity_sheets"],
      parentFacilitySlugs: ["hot_cold_food", "snacks", "hot_drinks"],
      ageSuitabilitySlugs: ["age_3", "age_4", "age_5", "age_6", "age_7", "age_8", "age_9", "age_10"],
      extraKitSlugs: ["sturdy_footwear"],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: ["challenges_or_missions", "hands_on_activities"],
    },
    {
      name: "Little Explorers Country Show",
      description:
        "A traditional agricultural show with family-friendly exhibits, animals, craft stalls, and arena events.",
      themeSlug: "a_big_day_out",
      themeVariantSlug: "seasonal_and_themed_events",
      eventTypeSlug: "country_show",
      activityGroupSlug: "special_day_out",
      startDate: new Date("2026-08-29"),
      endDate: new Date("2026-08-30"),
      startTime: "09:30",
      finishTime: "18:00",
      postCode: LOCATIONS.miltonKeynes.postCode,
      latitude: LOCATIONS.miltonKeynes.lat,
      longitude: LOCATIONS.miltonKeynes.lon,
      venuePostCode: LOCATIONS.miltonKeynes.postCode,
      parkingProvisionSlug: "paid_car_park",
      venueSettingSlug: "outside",
      adultCost: 18,
      childCost: 10,
      infantCost: 0,
      seasonalTagSlug: "summer",
      generalFacilitySlugs: ["toilets", "disabled_toilets", "baby_changing", "outdoor_seating", "picnic_benches"],
      kidsFacilitySlugs: ["activity_trail", "play_equipment", "treasure_hunt"],
      parentFacilitySlugs: ["hot_cold_food", "snacks", "hot_drinks"],
      ageSuitabilitySlugs: ["age_1", "age_2", "age_3", "age_4", "age_5", "age_6", "age_7", "age_8", "age_9", "age_10", "age_11", "age_12"],
      extraKitSlugs: ["wellies", "sturdy_footwear"],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: [
        "animal_displays_or_shows",
        "animal_feeding",
        "hands_on_petting",
        "live_shows_or_performances",
        "rides_and_attractions",
      ],
    },
  ];

  for (const data of events) {
    await client.opportunityEvent.create({ data });
  }

  console.log(`  Seeded ${events.length} opportunity events.`);
}

// ── Venues ──────────────────────────────────────────────────────────────────

export async function seedOpportunityVenues(client: PrismaClient = prisma) {
  await client.opportunityVenue.deleteMany();

  const venues = [
    {
      name: "World of Country Life",
      description:
        "A mix of farm experiences, museums, and play areas. Features animal petting, daily shows, a deer train safari, and extensive indoor/outdoor play areas.",
      postCode: LOCATIONS.hemel.postCode,
      latitude: LOCATIONS.hemel.lat,
      longitude: LOCATIONS.hemel.lon,
      venuePostcode: LOCATIONS.hemel.postCode,
      openingDaysAndTimes: "Monday–Sunday 10am–5pm",
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
    },
    {
      name: "Willowmere Adventure Park",
      description:
        "A high-energy adventure park with zip lines, climbing walls, aerial trails, and splash zones. Perfect for families with children aged 4 and up looking for an adrenaline-fuelled day out.",
      postCode: LOCATIONS.stevenage.postCode,
      latitude: LOCATIONS.stevenage.lat,
      longitude: LOCATIONS.stevenage.lon,
      venuePostcode: LOCATIONS.stevenage.postCode,
      openingDaysAndTimes: "Tuesday–Sunday 9:30am–5:30pm",
      openingExclusions: "Mondays (except Bank Holidays)",
      themeSlug: "a_big_day_out",
      themeVariantSlug: "amusement_park",
      activityGroupSlug: "energy_burner",
      terrainTypeSlug: "undulating",
      venueSettingSlug: "outside",
      parkingProvisionSlug: "free_car_park",
      adultCost: 0,
      childCost: 18,
      infantCost: 0,
      estimatedTimeToSpend: "3-4hrs",
      seasonalTagSlug: "summer",
      generalFacilitySlugs: ["toilets", "disabled_toilets", "outdoor_seating", "indoor_seating"],
      kidsFacilitySlugs: ["play_equipment", "activity_trail", "clues_games"],
      parentFacilitySlugs: ["hot_cold_food", "hot_drinks", "snacks", "outdoor_terrace"],
      dogFacilitySlugs: ["dog_bins"],
      ageSuitabilitySlugs: ["age_4", "age_5", "age_6", "age_7", "age_8", "age_9", "age_10", "age_11", "age_12", "age_13_plus"],
      extraKitSlugs: ["sturdy_footwear"],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: ["rides_and_attractions", "challenges_or_missions", "large_interactive_exhibits"],
    },
    {
      name: "Bluebell Wood Nature Reserve",
      description:
        "A peaceful ancient woodland blanketed in bluebells each spring. Marked family trails, wildlife-spotting guides, and a small visitor centre with bug hotels and nest boxes.",
      postCode: LOCATIONS.oxford.postCode,
      latitude: LOCATIONS.oxford.lat,
      longitude: LOCATIONS.oxford.lon,
      venuePostcode: LOCATIONS.oxford.postCode,
      openingDaysAndTimes: "Monday–Sunday 8am–dusk",
      openingExclusions: "None",
      themeSlug: "nature_and_wildlife_exploration",
      themeVariantSlug: "woodland_and_forest_walks",
      activityGroupSlug: "low_effort",
      terrainTypeSlug: "undulating",
      venueSettingSlug: "outside",
      parkingProvisionSlug: "free_car_park",
      adultCost: 0,
      childCost: 0,
      infantCost: 0,
      estimatedTimeToSpend: "1-2hrs",
      seasonalTagSlug: "easter",
      generalFacilitySlugs: ["toilets", "picnic_benches", "outdoor_seating"],
      kidsFacilitySlugs: ["childrens_trail", "activity_sheets", "treasure_hunt"],
      parentFacilitySlugs: ["hot_drinks", "snacks"],
      dogFacilitySlugs: ["lead_only", "dog_bins"],
      ageSuitabilitySlugs: ["under_1", "age_1", "age_2", "age_3", "age_4", "age_5", "age_6", "age_7", "age_8", "age_9", "age_10"],
      extraKitSlugs: ["wellies", "pram_buggy_road", "sling_baby_carrier"],
      seasonalHighlightSlugs: ["bluebells", "birdsong"],
      highlightAttractionSlugs: ["immersive_natural_surroundings", "hands_on_activities"],
    },
    {
      name: "Oakfield Farm Park",
      description:
        "A working farm park where children can meet rare breeds, bottle-feed lambs, and ride the tractor trailer around the grounds. Indoor soft-play barn for wet days.",
      postCode: LOCATIONS.luton.postCode,
      latitude: LOCATIONS.luton.lat,
      longitude: LOCATIONS.luton.lon,
      venuePostcode: LOCATIONS.luton.postCode,
      openingDaysAndTimes: "Wednesday–Sunday 10am–5pm",
      openingExclusions: "Monday, Tuesday",
      themeSlug: "animal_encounters",
      themeVariantSlug: "animal_parks_and_zoos",
      activityGroupSlug: "special_day_out",
      terrainTypeSlug: "flat",
      venueSettingSlug: "outside",
      parkingProvisionSlug: "free_car_park",
      adultCost: 10,
      childCost: 8,
      infantCost: 2,
      estimatedTimeToSpend: "2-3hrs",
      seasonalTagSlug: "easter",
      generalFacilitySlugs: ["toilets", "baby_changing", "picnic_benches", "indoor_seating", "outdoor_seating"],
      kidsFacilitySlugs: ["play_equipment", "activity_trail"],
      parentFacilitySlugs: ["hot_drinks", "hot_cold_food", "snacks"],
      dogFacilitySlugs: ["dog_bins", "lead_only"],
      ageSuitabilitySlugs: ["under_1", "age_1", "age_2", "age_3", "age_4", "age_5", "age_6", "age_7"],
      extraKitSlugs: ["wellies", "pram_buggy_road"],
      seasonalHighlightSlugs: ["baby_lambs"],
      highlightAttractionSlugs: ["animal_feeding", "hands_on_petting", "tractor_rides", "keeper_talks", "animal_displays_or_shows"],
    },
  ];

  for (const data of venues) {
    await client.opportunityVenue.create({ data });
  }

  console.log(`  Seeded ${venues.length} opportunity venues.`);
}

// ── Clubs ───────────────────────────────────────────────────────────────────

export async function seedOpportunityClubs(client: PrismaClient = prisma) {
  await client.opportunityClub.deleteMany();

  const clubs = [
    {
      name: "Little Muddy Boots",
      description:
        "Come and get messy, learn new skills and connect in our woodland setting.",
      themeSlug: "nature_and_wildlife_exploration",
      themeVariantSlug: "forest_school",
      postCode: LOCATIONS.watford.postCode,
      latitude: LOCATIONS.watford.lat,
      longitude: LOCATIONS.watford.lon,
      venuePostCode: LOCATIONS.watford.postCode,
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
    },
    {
      name: "Mini Athletes Club",
      description:
        "Fun sports sessions covering running, jumping, throwing, and team games. Builds confidence and coordination in a non-competitive, inclusive environment.",
      themeSlug: "green_spaces_to_run_around",
      postCode: LOCATIONS.stAlbans.postCode,
      latitude: LOCATIONS.stAlbans.lat,
      longitude: LOCATIONS.stAlbans.lon,
      venuePostCode: LOCATIONS.stAlbans.postCode,
      dayOfWeekSlug: "saturday",
      startTime: "09:30",
      finishTime: "10:30",
      activityGroupSlug: "energy_burner",
      clubFormatSlug: "lesson",
      clubFrequencySlug: "weekly",
      commitmentSlug: "termly_blocks",
      skillAreaSlug: "sports",
      skillAreaVariant: "Multi-sport",
      abilityLevelSlug: "beginner",
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "outside",
      adultCost: 0,
      childCost: 6,
      infantCost: 0,
      ageSuitabilitySlugs: ["age_3", "age_4", "age_5", "age_6", "age_7"],
      generalFacilitySlugs: ["toilets", "outdoor_seating"],
      kidsFacilitySlugs: ["play_equipment"],
      parentFacilitySlugs: ["clear_sightlines"],
      extraKitSlugs: ["sturdy_footwear"],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: ["challenges_or_missions"],
    },
    {
      name: "Little Artists",
      description:
        "Weekly creative sessions exploring painting, collage, print-making, and clay. All materials provided; every child leaves with something unique.",
      themeSlug: "a_big_day_out",
      postCode: LOCATIONS.hemel.postCode,
      latitude: LOCATIONS.hemel.lat,
      longitude: LOCATIONS.hemel.lon,
      venuePostCode: LOCATIONS.hemel.postCode,
      dayOfWeekSlug: "wednesday",
      startTime: "10:00",
      finishTime: "11:15",
      activityGroupSlug: "low_effort",
      clubFormatSlug: "lesson",
      clubFrequencySlug: "weekly",
      commitmentSlug: "termly_blocks",
      skillAreaSlug: "creative_arts",
      skillAreaVariant: "Mixed Media",
      abilityLevelSlug: "novice",
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "inside",
      adultCost: 0,
      childCost: 7,
      infantCost: 0,
      ageSuitabilitySlugs: ["age_2", "age_3", "age_4", "age_5", "age_6"],
      generalFacilitySlugs: ["toilets", "indoor_seating"],
      kidsFacilitySlugs: ["activity_sheets"],
      parentFacilitySlugs: ["hot_drinks", "clear_sightlines", "comfy_seating"],
      extraKitSlugs: [],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: ["hands_on_activities", "quiet_or_low_intervention_spaces"],
    },
    {
      name: "Family Yoga & Mindfulness",
      description:
        "Gentle yoga and mindfulness sessions designed for parents and children to enjoy together. Suitable for all abilities — no experience required.",
      themeSlug: "green_spaces_to_run_around",
      postCode: LOCATIONS.miltonKeynes.postCode,
      latitude: LOCATIONS.miltonKeynes.lat,
      longitude: LOCATIONS.miltonKeynes.lon,
      venuePostCode: LOCATIONS.miltonKeynes.postCode,
      dayOfWeekSlug: "sunday",
      startTime: "10:00",
      finishTime: "11:00",
      activityGroupSlug: "low_effort",
      clubFormatSlug: "stay_and_play_supervised",
      clubFrequencySlug: "weekly",
      commitmentSlug: "monthly",
      skillAreaSlug: "sports",
      skillAreaVariant: "Yoga",
      abilityLevelSlug: "novice",
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "inside",
      adultCost: 8,
      childCost: 4,
      infantCost: 0,
      ageSuitabilitySlugs: ["under_1", "age_1", "age_2", "age_3", "age_4", "age_5"],
      generalFacilitySlugs: ["toilets", "indoor_seating"],
      kidsFacilitySlugs: ["play_equipment"],
      parentFacilitySlugs: ["clear_sightlines", "comfy_seating", "hot_drinks"],
      extraKitSlugs: [],
      seasonalHighlightSlugs: [],
      highlightAttractionSlugs: ["quiet_or_low_intervention_spaces"],
    },
  ];

  for (const data of clubs) {
    await client.opportunityClub.create({ data });
  }

  console.log(`  Seeded ${clubs.length} opportunity clubs.`);
}

// ── Routes ──────────────────────────────────────────────────────────────────

export async function seedOpportunityRoutes(client: PrismaClient = prisma) {
  await client.opportunityRoute.deleteMany();

  const routes = [
    {
      name: "Woodbury Castle",
      description:
        "A short circular walk over the healthland of Woodbury. Great views, sturdy trails & gorseland.",
      themeSlug: "scenic_walks_and_wanders",
      themeVariantSlug: "woodland_and_forest_walks",
      routeTypeSlug: "circular",
      routeDistanceMiles: 0.8,
      difficultyRatingSlug: "easy",
      activityGroupSlug: "energy_burner",
      postCode: LOCATIONS.luton.postCode,
      latitude: LOCATIONS.luton.lat,
      longitude: LOCATIONS.luton.lon,
      startPointPostCode: LOCATIONS.luton.postCode,
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
    },
    {
      name: "Riverside Family Trail",
      description:
        "A gentle flat path following the river bank through water meadows and wildflower fields. Ideal for pushchairs and little legs — ducks and kingfishers often spotted along the way.",
      themeSlug: "scenic_walks_and_wanders",
      routeTypeSlug: "straight",
      routeDistanceMiles: 1.5,
      difficultyRatingSlug: "easy",
      activityGroupSlug: "low_effort",
      postCode: LOCATIONS.berkhamsted.postCode,
      latitude: LOCATIONS.berkhamsted.lat,
      longitude: LOCATIONS.berkhamsted.lon,
      startPointPostCode: LOCATIONS.berkhamsted.postCode,
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "outside",
      adultCost: 0,
      childCost: 0,
      infantCost: 0,
      interestTags: "Riverside, Wildlife spotting, Wildflowers, Flat terrain",
      seasonalTagSlug: "summer",
      routeSuitabilitySlugs: ["buggy", "carriers", "xc_buggies"],
      terrainTypeSlugs: ["flat"],
      generalFacilitySlugs: ["picnic_benches", "outdoor_seating"],
      dogFacilitySlugs: ["dog_bins"],
      extraKitSlugs: ["pram_buggy_road", "sling_baby_carrier"],
      seasonalHighlightSlugs: ["bluebells", "birdsong"],
    },
    {
      name: "Chiltern Hills Loop",
      description:
        "A classic Chilterns circuit through beech woodland and open chalk downland with sweeping valley views. Moderate gradient with clear waymarking throughout.",
      themeSlug: "scenic_walks_and_wanders",
      themeVariantSlug: "woodland_and_forest_walks",
      routeTypeSlug: "circular",
      routeDistanceMiles: 3.2,
      difficultyRatingSlug: "challenging",
      activityGroupSlug: "energy_burner",
      postCode: LOCATIONS.hemel.postCode,
      latitude: LOCATIONS.hemel.lat,
      longitude: LOCATIONS.hemel.lon,
      startPointPostCode: LOCATIONS.hemel.postCode,
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "outside",
      adultCost: 0,
      childCost: 0,
      infantCost: 0,
      interestTags: "Beech woodland, Chalk downland, Views, Wildlife",
      seasonalTagSlug: "autumn",
      routeSuitabilitySlugs: ["mountain_bikes", "carriers"],
      terrainTypeSlugs: ["undulating", "uneven"],
      generalFacilitySlugs: ["picnic_benches"],
      dogFacilitySlugs: ["dog_bins", "lead_only"],
      extraKitSlugs: ["sturdy_footwear", "sling_baby_carrier"],
      seasonalHighlightSlugs: ["autumn_colours", "autumn_leaves"],
    },
    {
      name: "Park Run & Play",
      description:
        "A marked 2km loop around a flat urban park — great for buggy runs, scooting, and teaching older children to pace themselves. Ends at the playground.",
      themeSlug: "green_spaces_to_run_around",
      routeTypeSlug: "circular",
      routeDistanceMiles: 1.2,
      difficultyRatingSlug: "easy",
      activityGroupSlug: "energy_burner",
      postCode: LOCATIONS.stAlbans.postCode,
      latitude: LOCATIONS.stAlbans.lat,
      longitude: LOCATIONS.stAlbans.lon,
      startPointPostCode: LOCATIONS.stAlbans.postCode,
      parkingProvisionSlug: "free_car_park",
      venueSettingSlug: "outside",
      adultCost: 0,
      childCost: 0,
      infantCost: 0,
      interestTags: "Flat, Tarmac path, Playground, Scooter friendly",
      seasonalTagSlug: "summer",
      routeSuitabilitySlugs: ["buggy", "bikes", "carriers"],
      terrainTypeSlugs: ["flat"],
      generalFacilitySlugs: ["toilets", "picnic_benches", "outdoor_seating"],
      dogFacilitySlugs: ["dog_bins"],
      extraKitSlugs: ["pram_buggy_road"],
      seasonalHighlightSlugs: [],
    },
  ];

  for (const data of routes) {
    await client.opportunityRoute.create({ data });
  }

  console.log(`  Seeded ${routes.length} opportunity routes.`);
}

// ── Main (standalone run) ────────────────────────────────────────────────────

async function main() {
  console.log("Seeding opportunity events...");
  await seedOpportunityEvents();

  console.log("Seeding opportunity venues...");
  await seedOpportunityVenues();

  console.log("Seeding opportunity clubs...");
  await seedOpportunityClubs();

  console.log("Seeding opportunity routes...");
  await seedOpportunityRoutes();

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
