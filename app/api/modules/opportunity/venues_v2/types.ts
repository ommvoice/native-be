export interface OpportunityVenuesV2ThemeRef {
  id: string;
  slug: string;
  name: string;
  recordType: string;
}

export interface OpportunityVenuesV2ThemeVariantRef {
  id: string;
  slug: string;
  name: string;
}

/** API shape: spreadsheet-style scalars plus theme rows stored inline. */
export interface OpportunityVenuesV2Response {
  id: string;
  opportunityType: string;
  theme: OpportunityVenuesV2ThemeRef;
  themeVariant: OpportunityVenuesV2ThemeVariantRef;
  venueName: string;
  venueActivityGroup: string | null;
  venueDescription: string | null;
  venueAddressLine1: string | null;
  venueAddressLine2: string | null;
  venueCity: string | null;
  venueRegion: string | null;
  venuePostcode: string | null;
  latitude: string | null;
  longitude: string | null;
  venueCountry: string | null;
  venueSchedulePattern: string | null;
  venueFixedDailyTimings: boolean | null;
  venueFixedTimingsStartTime: string | null;
  venueFixedTimingsEndTime: string | null;
  venueMixedTimingsMondayStart: string | null;
  venueMixedTimingsMondayEnd: string | null;
  venueMixedTimingsTuesdayStart: string | null;
  venueMixedTimingsTuesdayEnd: string | null;
  venueMixedTimingsWednesdayStart: string | null;
  venueMixedTimingsWednesdayEnd: string | null;
  venueMixedTimingsThursdayStart: string | null;
  venueMixedTimingsThursdayEnd: string | null;
  venueMixedTimingsFridayStart: string | null;
  venueMixedTimingsFridayEnd: string | null;
  venueMixedTimingsSaturdayStart: string | null;
  venueMixedTimingsSaturdayEnd: string | null;
  venueMixedTimingsSundayStart: string | null;
  venueMixedTimingsSundayEnd: string | null;
  venueEntryCost: boolean | null;
  ticketingRequirement: boolean | null;
  venueBookingType: string | null;
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
  venueGeneralFacilities: string | null;
  venueChildFacilities: string | null;
  venueAdultFacilities: string | null;
  venueDogFacilities: string | null;
  venueParkingProvision: string | null;
  venueAgeSuitabilityUnder1Years: boolean | null;
  venueAgeSuitability1To2Years: boolean | null;
  venueAgeSuitability3To4Years: boolean | null;
  venueAgeSuitability5To7Years: boolean | null;
  venueAgeSuitability8To12Years: boolean | null;
  venueAgeSuitabilityOver13Years: boolean | null;
  venueAgeSuitabilityAdults: boolean | null;
  venuePhysicalSetting: string | null;
  venueDetailedWeatherSuitability: string | null;
  venueEstimatedDuration: string | null;
  venueInterestTags: string | null;
  venueSeasonalTag: string | null;
  venueSeasonalHighlights: string | null;
  venueAttractions: string | null;
  venueExtraKit: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
