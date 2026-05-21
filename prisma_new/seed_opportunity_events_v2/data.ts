import type { Prisma } from "@prisma/client";
import type { OpportunityEventV2SeedInput } from "./create_opportunity_event_v2_row.js";

type Row = OpportunityEventV2SeedInput;

/** UK calendar dates as UTC midnight (avoid TZ shifting the calendar day). */
function uk(d: string): Date {
  const parts = d.split("/").map(Number);
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  if (
    day === undefined ||
    month === undefined ||
    year === undefined ||
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year)
  ) {
    throw new Error(`Invalid UK date: ${d}`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

/** WGS84 from postcodes.io (centre of postcode sector). */
const COORDS_PL9_0HP = {
  latitude: "50.320032",
  longitude: "-4.079484",
} as const;

const COORDS_TQ12_4RG = {
  latitude: "50.534332",
  longitude: "-3.553749",
} as const;

/**
 * Spreadsheet import rows (Wembury / Amelia’s PYO). Requires
 * `npx prisma migrate deploy` and `npm run seed:opportunity-themes` first
 * so `event` themes include Marine Aquarium + Family-Friendly Cafés variants.
 * Load rows with `npm run seed:opportunity-events-v2`.
 */
export function opportunityEventV2SeedRows(): Row[] {
  const rows: Row[] = [];

  rows.push({
    themeSlug: "animal_encounters",
    themeVariantSlug: "sealife_aquarium",
    opportunityType: "event",
    eventName: "Tots & Toddlers Rockpool Safari",
    eventActivityGroup: "Simple Reset",
    eventType: "Nature-based",
    eventDescription:
      "Join Devon Wildlife Trust staff and volunteers for a mini rockpool safari aimed at tots & toddlers, that gives them a fun introduction to rockpooling. No need to bring fishing nets as DWT follow the Seashore Code and provide buckets, but bring suitable footwear as the rocks get very slippery.",
    eventAddressLine1: "Wembury Marine Centre",
    eventAddressLine2: "Church Rd",
    eventCity: "Wembury",
    eventRegion: "Devon",
    eventPostcode: "PL9 0HP",
    eventCountry: null,
    ...COORDS_PL9_0HP,
    eventPhysicalSetting: "Outside",
    eventDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    eventStartDate: uk("14/06/2026"),
    eventEndDate: uk("14/06/2026"),
    eventDaysTotal: 1,
    eventDailyMultiSession: false,
    eventTimetableWeekly: null,
    eventDailyFixedTimings: false,
    eventDailyFixedStartTime: "10:00",
    eventDailyFixedEndTime: "11:00",
    eventDailyMultiSessionTotal: null,
    eventDailyMultiSessionTimings: null,
    eventWeeklyFixedStartTime: null,
    eventWeeklyFixedEndTime: null,
    ...emptyMixedTimings(),
    ticketSalesStartDate: uk("10/05/2026"),
    eventEntryCost: true,
    eventBookingType: "Advance Book",
    ticketingVariants: "(Fixed) Child",
    ticketVariantDefinitionBaby: null,
    ticketVariantBabyPrice: null,
    ticketVariantDefinitionFixedChild: "0-16",
    ticketVariantFixedChildPrice: "£5.00",
    ticketVariantDefinitionYoungChild: null,
    ticketVariantYoungChildPrice: null,
    ticketVariantDefinitionOlderChild: null,
    ticketVariantOlderChildPrice: null,
    ticketVariantDefinitionAdult: "18+",
    ticketVariantAdultPrice: "£0.00",
    ticketVariantDefinitionConcession: null,
    ticketVariantConcessionPrice: null,
    ticketVariantDefinitionGroup: null,
    ticketVariantGroupPrice: null,
    eventParkingProvision: "Paid Car Park, Bike racks / bays",
    eventGeneralFacilities:
      "Toilets, Picnic Benches, Disabled toilets, Service Dogs Only, Baby changing",
    eventChildFacilities: null,
    eventAdultFacilities: "Giftshop, Hot Drinks, Snacks",
    eventAgeSuitabilityUnder1S: false,
    eventAgeSuitability1To2Years: true,
    eventAgeSuitability3To4Years: true,
    eventAgeSuitability5To7Years: false,
    eventAgeSuitability8To12Years: false,
    eventAgeSuitabilityOver13Years: false,
    eventAgeSuitabilityAdults: false,
    eventInterestTags:
      "rockpooling, crabs, sealife, beach combing, marine life",
    eventSeasonalTags: null,
    eventSeasonalHighlights: null,
    eventHighlights:
      "Rockpooling, Guided wildlife spotting, Beach Combing",
    eventExtraKit:
      "Water shoes, Wellies, Activity-specific clothing",
    eventSkillArea: "Outdoors & Nature",
    eventSkillAreaVariant: null,
    eventAbilityLevel: "None / Novice",
    image: "Rockpool Safari.jpg",
  });

  rows.push({
    themeSlug: "nature_and_wildlife_exploration",
    themeVariantSlug: "wildlife_spotting",
    opportunityType: "event",
    eventName: "Shoresearch Volunteer Survey",
    eventActivityGroup: "Simple Reset, Low Effort",
    eventType: "Nature-based",
    eventDescription:
      "A fascinating way to explore your local coast, learn more about the wildlife found there and add to your understanding of this important habitat. Suitable for young adults that have a keen interest in wildlife conservation and better understanding the effects of pollution, climate change and invasive alien species; perfect for those fascinated by marine life.",
    eventAddressLine1: "Wembury Marine Centre",
    eventAddressLine2: "Church Rd",
    eventCity: "Wembury",
    eventRegion: "Devon",
    eventPostcode: "PL9 0HP",
    eventCountry: null,
    ...COORDS_PL9_0HP,
    eventPhysicalSetting: "Outside",
    eventDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    eventStartDate: uk("17/07/2026"),
    eventEndDate: uk("17/07/2026"),
    eventDaysTotal: 1,
    eventDailyMultiSession: false,
    eventTimetableWeekly: null,
    eventDailyFixedTimings: false,
    eventDailyFixedStartTime: "13:30",
    eventDailyFixedEndTime: "15:30",
    eventDailyMultiSessionTotal: null,
    eventDailyMultiSessionTimings: null,
    eventWeeklyFixedStartTime: null,
    eventWeeklyFixedEndTime: null,
    ...emptyMixedTimings(),
    ticketSalesStartDate: uk("10/05/2026"),
    eventEntryCost: false,
    eventBookingType: "Advance Book",
    ticketingVariants: "Adult",
    ticketVariantDefinitionBaby: null,
    ticketVariantBabyPrice: null,
    ticketVariantDefinitionFixedChild: null,
    ticketVariantFixedChildPrice: null,
    ticketVariantDefinitionYoungChild: null,
    ticketVariantYoungChildPrice: null,
    ticketVariantDefinitionOlderChild: null,
    ticketVariantOlderChildPrice: null,
    ticketVariantDefinitionAdult: "18+",
    ticketVariantAdultPrice: "£0.00",
    ticketVariantDefinitionConcession: null,
    ticketVariantConcessionPrice: null,
    ticketVariantDefinitionGroup: null,
    ticketVariantGroupPrice: null,
    eventParkingProvision: "Paid Car Park, Bike racks / bays",
    eventGeneralFacilities: "Toilets, Disabled toilets, Baby changing",
    eventChildFacilities: null,
    eventAdultFacilities: "Giftshop, Hot Drinks, Snacks",
    eventAgeSuitabilityUnder1S: false,
    eventAgeSuitability1To2Years: false,
    eventAgeSuitability3To4Years: false,
    eventAgeSuitability5To7Years: false,
    eventAgeSuitability8To12Years: false,
    eventAgeSuitabilityOver13Years: true,
    eventAgeSuitabilityAdults: true,
    eventInterestTags:
      "coastal conservation, natural habitats, bird spotting, marine life, climate change, invasive species",
    eventSeasonalTags: null,
    eventSeasonalHighlights: "Seabird Colonies, Migrating Birds",
    eventHighlights:
      "Coastal wildlife education, Guided surveying, Marine Life Training, Wildlife Spotting, Coastal Views",
    eventExtraKit:
      "Sturdy footwear, Binoculars, Activity-specific clothing",
    eventSkillArea:
      "Outdoors & Nature, Global Awareness, Life Skills",
    eventSkillAreaVariant: null,
    eventAbilityLevel: "None / Novice",
    image: "dwt survey.jpg",
  });

  rows.push({
    themeSlug: "creative_and_expressive_play",
    themeVariantSlug: "making_and_creating",
    opportunityType: "event",
    eventName: "Cyanotype Crafting Workshop",
    eventActivityGroup: "Low Effort, Moment of Peace",
    eventType: "Craft- or Skills-based",
    eventDescription:
      "Use the intricate shapes of seaweed and a little bit of chemistry to make beautiful pieces of artwork using materials from the beach, that you can take home with you. Guests will also learn about marine life, the different types of seaweed that can be found washed up on the strandline, as well as the history of cyanotypes.",
    eventAddressLine1: "Wembury Marine Centre",
    eventAddressLine2: "Church Rd",
    eventCity: "Wembury",
    eventRegion: "Devon",
    eventPostcode: "PL9 0HP",
    eventCountry: null,
    ...COORDS_PL9_0HP,
    eventPhysicalSetting: "Mixed",
    eventDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot, Windy (> X mph)",
    eventStartDate: uk("16/07/2026"),
    eventEndDate: uk("16/07/2026"),
    eventDaysTotal: 1,
    eventDailyMultiSession: false,
    eventTimetableWeekly: null,
    eventDailyFixedTimings: false,
    eventDailyFixedStartTime: "10:30",
    eventDailyFixedEndTime: "15:30",
    eventDailyMultiSessionTotal: null,
    eventDailyMultiSessionTimings: null,
    eventWeeklyFixedStartTime: null,
    eventWeeklyFixedEndTime: null,
    ...emptyMixedTimings(),
    ticketSalesStartDate: uk("10/05/2026"),
    eventEntryCost: true,
    eventBookingType: "Advance Book",
    ticketingVariants: "Adult, (Fixed) Child",
    ticketVariantDefinitionBaby: null,
    ticketVariantBabyPrice: null,
    ticketVariantDefinitionFixedChild: "0-17",
    ticketVariantFixedChildPrice: "£12.50",
    ticketVariantDefinitionYoungChild: null,
    ticketVariantYoungChildPrice: null,
    ticketVariantDefinitionOlderChild: null,
    ticketVariantOlderChildPrice: null,
    ticketVariantDefinitionAdult: "18+",
    ticketVariantAdultPrice: "£12.50",
    ticketVariantDefinitionConcession: null,
    ticketVariantConcessionPrice: null,
    ticketVariantDefinitionGroup: null,
    ticketVariantGroupPrice: null,
    eventParkingProvision: "Paid Car Park, Bike racks / bays",
    eventGeneralFacilities: "Toilets, Disabled toilets, Baby changing",
    eventChildFacilities: null,
    eventAdultFacilities: "Giftshop, Hot Drinks, Snacks",
    eventAgeSuitabilityUnder1S: false,
    eventAgeSuitability1To2Years: false,
    eventAgeSuitability3To4Years: false,
    eventAgeSuitability5To7Years: true,
    eventAgeSuitability8To12Years: true,
    eventAgeSuitabilityOver13Years: true,
    eventAgeSuitabilityAdults: true,
    eventInterestTags: "cyanotype, coastal art, marine wildlife, craft",
    eventSeasonalTags: null,
    eventSeasonalHighlights: null,
    eventHighlights: "Coastal education, Takehome artwork",
    eventExtraKit: null,
    eventSkillArea: "Crafting & Art",
    eventSkillAreaVariant: null,
    eventAbilityLevel: "None / Novice",
    image: "DWT Crafting.jpg",
  });

  rows.push({
    themeSlug: "nature_and_wildlife_exploration",
    themeVariantSlug: "wildlife_spotting",
    opportunityType: "event",
    eventName: "Snorkel Safari",
    eventActivityGroup: "Energy Burner, Special Day Out",
    eventType: "Nature-based",
    eventDescription:
      "Join Devon Wildlife Trust's fully qualified BSAC Snorkel Instructors for a snorkel safari where you'll cover basic snorkelling techniques, followed by a guided snorkel around Wembury Bay's famous rocky reefs, searching for and identifying underwater marine life as you go!",
    eventAddressLine1: "Wembury Marine Centre",
    eventAddressLine2: "Church Rd",
    eventCity: "Wembury",
    eventRegion: "Devon",
    eventPostcode: "PL9 0HP",
    eventCountry: null,
    ...COORDS_PL9_0HP,
    eventPhysicalSetting: "Outside",
    eventDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    eventStartDate: uk("18/07/2026"),
    eventEndDate: uk("18/07/2026"),
    eventDaysTotal: 1,
    eventDailyMultiSession: false,
    eventTimetableWeekly: null,
    eventDailyFixedTimings: false,
    eventDailyFixedStartTime: "13:00",
    eventDailyFixedEndTime: "15:30",
    eventDailyMultiSessionTotal: null,
    eventDailyMultiSessionTimings: null,
    eventWeeklyFixedStartTime: null,
    eventWeeklyFixedEndTime: null,
    ...emptyMixedTimings(),
    ticketSalesStartDate: uk("10/05/2026"),
    eventEntryCost: true,
    eventBookingType: "Advance Book",
    ticketingVariants: "Adult, Older Child",
    ticketVariantDefinitionBaby: null,
    ticketVariantBabyPrice: null,
    ticketVariantDefinitionFixedChild: null,
    ticketVariantFixedChildPrice: null,
    ticketVariantDefinitionYoungChild: null,
    ticketVariantYoungChildPrice: null,
    ticketVariantDefinitionOlderChild: "8-18",
    ticketVariantOlderChildPrice: "£30.00",
    ticketVariantDefinitionAdult: "18+",
    ticketVariantAdultPrice: "£30.00",
    ticketVariantDefinitionConcession: null,
    ticketVariantConcessionPrice: null,
    ticketVariantDefinitionGroup: null,
    ticketVariantGroupPrice: null,
    eventParkingProvision: "Paid Car Park, Bike racks / bays",
    eventGeneralFacilities:
      "Toilets, Disabled toilets, Baby changing, Guided Tour",
    eventChildFacilities: null,
    eventAdultFacilities: "Giftshop, Hot Drinks, Snacks",
    eventAgeSuitabilityUnder1S: false,
    eventAgeSuitability1To2Years: false,
    eventAgeSuitability3To4Years: false,
    eventAgeSuitability5To7Years: false,
    eventAgeSuitability8To12Years: true,
    eventAgeSuitabilityOver13Years: true,
    eventAgeSuitabilityAdults: true,
    eventInterestTags: "snorkeling, marine safari",
    eventSeasonalTags: null,
    eventSeasonalHighlights: null,
    eventHighlights: "Snorkeling Experience",
    eventExtraKit: "Towels, Swimming kit, Water shoes",
    eventSkillArea: "Outdoors & Nature",
    eventSkillAreaVariant: null,
    eventAbilityLevel: "Beginner",
    image: "Snorkel Safari.jpg",
  });

  rows.push({
    themeSlug: "a_relaxed_coffee_stop",
    themeVariantSlug: "family_friendly_cafes",
    opportunityType: "event",
    eventName: "Amelia's Flower Farm PYO",
    eventActivityGroup: "Moment of Peace, Simple Reset, Low Effort",
    eventType: "PYO",
    eventDescription:
      "A thoughtfully designed flower farm-come-cafe with stunning pick-your-own blooms, baked refreshments, plant sales and a calm, seasonal feel. Bouquets are selected and handpicked from seasonal flowerbeds dotted around the grounds, giving families a relaxing setting for a creative moment of calm in a picturesque setting.",
    eventAddressLine1: "Amelias Flower Farm",
    eventAddressLine2: "Combeinteignhead",
    eventCity: "Newton Abbot",
    eventRegion: "Devon",
    eventPostcode: "TQ12 4RG",
    eventCountry: null,
    ...COORDS_TQ12_4RG,
    eventPhysicalSetting: "Outside",
    eventDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    eventStartDate: uk("23/05/2026"),
    eventEndDate: uk("01/09/2026"),
    eventDaysTotal: 101,
    eventDailyMultiSession: true,
    eventTimetableWeekly:
      "Monday, Tuesday, Wednesday, Thursday, Friday, Sunday, Saturday",
    eventDailyFixedTimings: true,
    eventDailyFixedStartTime: null,
    eventDailyFixedEndTime: null,
    eventDailyMultiSessionTotal: null,
    eventDailyMultiSessionTimings: null,
    eventWeeklyFixedStartTime: "10:00",
    eventWeeklyFixedEndTime: "16:00",
    ...emptyMixedTimings(),
    ticketSalesStartDate: uk("26/05/2026"),
    eventEntryCost: false,
    eventBookingType: "Open (Free) Access",
    ticketingVariants: null,
    ticketVariantDefinitionBaby: null,
    ticketVariantBabyPrice: null,
    ticketVariantDefinitionFixedChild: null,
    ticketVariantFixedChildPrice: null,
    ticketVariantDefinitionYoungChild: null,
    ticketVariantYoungChildPrice: null,
    ticketVariantDefinitionOlderChild: null,
    ticketVariantOlderChildPrice: null,
    ticketVariantDefinitionAdult: null,
    ticketVariantAdultPrice: null,
    ticketVariantDefinitionConcession: null,
    ticketVariantConcessionPrice: null,
    ticketVariantDefinitionGroup: null,
    ticketVariantGroupPrice: null,
    eventParkingProvision:
      "Free Car Park, Bike racks / bays, Horse “parking”",
    eventGeneralFacilities:
      "Toilets, Disabled toilets, Baby changing, Indoor Seating, Dogs Allowed, Outdoor Seating",
    eventChildFacilities:
      "Ice creams, Activity sheets, Colouring, Indoor games (puzzles, boards), Swings, Slides, Climbing Frames, Outdoor play equipment",
    eventAdultFacilities:
      "Hot Drinks, Comfy Seating / Sofas, Snacks, Sweet treats, Giftshop",
    eventAgeSuitabilityUnder1S: true,
    eventAgeSuitability1To2Years: true,
    eventAgeSuitability3To4Years: true,
    eventAgeSuitability5To7Years: true,
    eventAgeSuitability8To12Years: true,
    eventAgeSuitabilityOver13Years: true,
    eventAgeSuitabilityAdults: true,
    eventInterestTags: "PYO, wildflowers, seasonal flowers, floristry",
    eventSeasonalTags: "Spring flowers, Summer",
    eventSeasonalHighlights: "PYO Flowers",
    eventHighlights: "PYO Flower Bouquets, Picturesque Views",
    eventExtraKit: null,
    eventSkillArea: "Creative Arts",
    eventSkillAreaVariant: null,
    eventAbilityLevel: "None / Novice",
    image: "Amelias Flower Farm PYO.JPEG",
  });

  return rows;
}

function emptyMixedTimings(): Pick<
  Prisma.OpportunityEventsV2UncheckedCreateInput,
  | "eventMixedTimingsMondayStart"
  | "eventMixedTimingsMondayEnd"
  | "eventMixedTimingsTuesdayStart"
  | "eventMixedTimingsTuesdayEnd"
  | "eventMixedTimingsWednesdayStart"
  | "eventMixedTimingsWednesdayEnd"
  | "eventMixedTimingsThursdayStart"
  | "eventMixedTimingsThursdayEnd"
  | "eventMixedTimingsFridayStart"
  | "eventMixedTimingsFridayEnd"
  | "eventMixedTimingsSaturdayStart"
  | "eventMixedTimingsSaturdayEnd"
  | "eventMixedTimingsSundayStart"
  | "eventMixedTimingsSundayEnd"
> {
  return {
    eventMixedTimingsMondayStart: null,
    eventMixedTimingsMondayEnd: null,
    eventMixedTimingsTuesdayStart: null,
    eventMixedTimingsTuesdayEnd: null,
    eventMixedTimingsWednesdayStart: null,
    eventMixedTimingsWednesdayEnd: null,
    eventMixedTimingsThursdayStart: null,
    eventMixedTimingsThursdayEnd: null,
    eventMixedTimingsFridayStart: null,
    eventMixedTimingsFridayEnd: null,
    eventMixedTimingsSaturdayStart: null,
    eventMixedTimingsSaturdayEnd: null,
    eventMixedTimingsSundayStart: null,
    eventMixedTimingsSundayEnd: null,
  };
}
