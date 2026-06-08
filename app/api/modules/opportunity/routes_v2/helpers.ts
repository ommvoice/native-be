import type { OpportunityRouteV2Response } from "./types.js";

const s = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const b = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

export function enrichOpportunityRouteV2Response(
  item: Record<string, unknown>,
): OpportunityRouteV2Response {
  const themeSlug = (item.themeSlug as string) ?? "";
  const themeVariantSlug = (item.themeVariantSlug as string) ?? "";
  const oppType = (item.opportunityType as string) ?? "route";

  return {
    id: item.id as string,
    opportunityType: oppType,
    theme: {
      id: themeSlug,
      slug: themeSlug,
      name: themeSlug,
      recordType: oppType,
    },
    themeVariant: {
      id: themeVariantSlug,
      slug: themeVariantSlug,
      name: themeVariantSlug,
    },
    routeName: (item.routeName as string) ?? "",
    routeActivityGrouping: s(item.routeActivityGrouping),
    routeDescription: s(item.routeDescription),
    routeType: s(item.routeType),
    routeDistance: s(item.routeDistance),
    routeTerrainType: s(item.routeTerrainType),
    routeDifficulty: s(item.routeDifficulty),
    routeAddressLine1: s(item.routeAddressLine1),
    routeAddressLine2: s(item.routeAddressLine2),
    routeRegion: s(item.routeRegion),
    routePostcode: s(item.routePostcode),
    latitude: s(item.latitude),
    longitude: s(item.longitude),
    routeCountry: s(item.routeCountry),
    routeParkingProvision: s(item.routeParkingProvision),
    routeGeneralFacilities: s(item.routeGeneralFacilities),
    routeChildFacilities: s(item.routeChildFacilities),
    routeAdultFacilities: s(item.routeAdultFacilities),
    routeDogFacilities: s(item.routeDogFacilities),
    routeAgeSuitabilityUnder1S: b(item.routeAgeSuitabilityUnder1S),
    routeAgeSuitability1To2Years: b(item.routeAgeSuitability1To2Years),
    routeAgeSuitability3To4Years: b(item.routeAgeSuitability3To4Years),
    routeAgeSuitability5To7Years: b(item.routeAgeSuitability5To7Years),
    routeAgeSuitability8To12Years: b(item.routeAgeSuitability8To12Years),
    routeAgeSuitabilityOver13Years: b(item.routeAgeSuitabilityOver13Years),
    routeAgeSuitabilityAdults: b(item.routeAgeSuitabilityAdults),
    routePhysicalSetting: s(item.routePhysicalSetting),
    routeDetailedWeatherSuitability: s(item.routeDetailedWeatherSuitability),
    routeEstimatedDuration: s(item.routeEstimatedDuration),
    routeInterestTags: s(item.routeInterestTags),
    routeSeasonalTag: s(item.routeSeasonalTag),
    routeSeasonalHighlights: s(item.routeSeasonalHighlights),
    routeAttractions: s(item.routeAttractions),
    routeExtraKit: s(item.routeExtraKit),
    image: s(item.image),
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}
