import type { Prisma } from "@prisma/client";

export const opportunityVenueV2Include = {
  theme: true,
  themeVariant: true,
} as const;

export type EnrichableOpportunityVenueV2 = Prisma.OpportunityVenueV2GetPayload<{
  include: typeof opportunityVenueV2Include;
}>;

export interface OpportunityVenueV2ThemeRef {
  id: string;
  slug: string;
  name: string;
  recordType: string;
}

export interface OpportunityVenueV2ThemeVariantRef {
  id: string;
  slug: string;
  name: string;
}

/** API shape: spreadsheet-style scalars plus theme rows from DB. */
export interface OpportunityVenueV2Response {
  id: string;
  opportunityType: string;
  theme: OpportunityVenueV2ThemeRef;
  themeVariant: OpportunityVenueV2ThemeVariantRef;
  eventName: string;
  eventActivityGroup: string | null;
  eventType: string | null;
  eventDescription: string | null;
  eventAddressLine1: string | null;
  eventAddressLine2: string | null;
  eventCity: string | null;
  eventRegion: string | null;
  eventPostcode: string | null;
  eventCountry: string | null;
  latitude: string | null;
  longitude: string | null;
  eventPhysicalSetting: string | null;
  eventDetailedWeatherSuitability: string | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  eventDaysTotal: number | null;
  eventDailyMultiSession: boolean | null;
  eventTimetableWeekly: string | null;
  eventDailyFixedTimings: boolean | null;
  eventDailyFixedStartTime: string | null;
  eventDailyFixedEndTime: string | null;
  eventDailyMultiSessionTotal: number | null;
  eventDailyMultiSessionTimings: string | null;
  eventWeeklyFixedStartTime: string | null;
  eventWeeklyFixedEndTime: string | null;
  eventMixedTimingsMondayStart: string | null;
  eventMixedTimingsMondayEnd: string | null;
  eventMixedTimingsTuesdayStart: string | null;
  eventMixedTimingsTuesdayEnd: string | null;
  eventMixedTimingsWednesdayStart: string | null;
  eventMixedTimingsWednesdayEnd: string | null;
  eventMixedTimingsThursdayStart: string | null;
  eventMixedTimingsThursdayEnd: string | null;
  eventMixedTimingsFridayStart: string | null;
  eventMixedTimingsFridayEnd: string | null;
  eventMixedTimingsSaturdayStart: string | null;
  eventMixedTimingsSaturdayEnd: string | null;
  eventMixedTimingsSundayStart: string | null;
  eventMixedTimingsSundayEnd: string | null;
  ticketSalesStartDate: Date | null;
  eventEntryCost: boolean | null;
  eventBookingType: string | null;
  ticketingVariants: string | null;
  ticketVariantDefinitionBaby: string | null;
  ticketVariantBabyPrice: string | null;
  ticketVariantDefinitionFixedChild: string | null;
  ticketVariantFixedChildPrice: string | null;
  ticketVariantDefinitionYoungChild: string | null;
  ticketVariantYoungChildPrice: string | null;
  ticketVariantDefinitionOlderChild: string | null;
  ticketVariantOlderChildPrice: string | null;
  ticketVariantDefinitionAdult: string | null;
  ticketVariantAdultPrice: string | null;
  ticketVariantDefinitionConcession: string | null;
  ticketVariantConcessionPrice: string | null;
  ticketVariantDefinitionGroup: string | null;
  ticketVariantGroupPrice: string | null;
  eventParkingProvision: string | null;
  eventGeneralFacilities: string | null;
  eventChildFacilities: string | null;
  eventAdultFacilities: string | null;
  eventAgeSuitabilityUnder1S: boolean | null;
  eventAgeSuitability1To2Years: boolean | null;
  eventAgeSuitability3To4Years: boolean | null;
  eventAgeSuitability5To7Years: boolean | null;
  eventAgeSuitability8To12Years: boolean | null;
  eventAgeSuitabilityOver13Years: boolean | null;
  eventAgeSuitabilityAdults: boolean | null;
  eventInterestTags: string | null;
  eventSeasonalTags: string | null;
  eventSeasonalHighlights: string | null;
  eventHighlights: string | null;
  eventExtraKit: string | null;
  eventSkillArea: string | null;
  eventSkillAreaVariant: string | null;
  eventAbilityLevel: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
