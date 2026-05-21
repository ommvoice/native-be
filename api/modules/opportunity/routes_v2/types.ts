export interface OpportunityRouteV2ThemeRef {
  id: string;
  slug: string;
  name: string;
  recordType: string;
}

export interface OpportunityRouteV2ThemeVariantRef {
  id: string;
  slug: string;
  name: string;
}

/** API shape: spreadsheet-style scalars plus theme rows stored inline. */
export interface OpportunityRouteV2Response {
  id: string;
  opportunityType: string;
  theme: OpportunityRouteV2ThemeRef;
  themeVariant: OpportunityRouteV2ThemeVariantRef;
  routeName: string;
  routeActivityGrouping: string | null;
  routeDescription: string | null;
  routeType: string | null;
  routeDistance: string | null;
  routeTerrainType: string | null;
  routeDifficulty: string | null;
  routeAddressLine1: string | null;
  routeAddressLine2: string | null;
  routeRegion: string | null;
  routePostcode: string | null;
  latitude: string | null;
  longitude: string | null;
  routeCountry: string | null;
  routeParkingProvision: string | null;
  routeGeneralFacilities: string | null;
  routeChildFacilities: string | null;
  routeAdultFacilities: string | null;
  routeDogFacilities: string | null;
  routeAgeSuitabilityUnder1S: boolean | null;
  routeAgeSuitability1To2Years: boolean | null;
  routeAgeSuitability3To4Years: boolean | null;
  routeAgeSuitability5To7Years: boolean | null;
  routeAgeSuitability8To12Years: boolean | null;
  routeAgeSuitabilityOver13Years: boolean | null;
  routeAgeSuitabilityAdults: boolean | null;
  routePhysicalSetting: string | null;
  routeDetailedWeatherSuitability: string | null;
  routeEstimatedDuration: string | null;
  routeInterestTags: string | null;
  routeSeasonalTag: string | null;
  routeSeasonalHighlights: string | null;
  routeAttractions: string | null;
  routeExtraKit: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
