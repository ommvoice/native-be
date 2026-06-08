import { opportunityRouteDifficultyLabel } from "./constants/difficulty-rating.js";
import { opportunityRouteDogFacilityLabel } from "./constants/dog-facility.js";
import { opportunityRouteSuitabilityLabel } from "./constants/route-suitability.js";
import { opportunityRouteTypeLabel } from "./constants/route-type.js";
import type {
  EnrichableOpportunityRoute,
  OpportunityRouteResponse,
} from "./types.js";
import { opportunityEventActivityGroupLabel } from "../common/constants/opportunity-activity-group.js";
import { opportunityEventExtraKitLabel } from "../common/constants/opportunity-extra-kit.js";
import { opportunityEventGeneralFacilityLabel } from "../common/constants/opportunity-general-facility.js";
import { opportunityEventHighlightAttractionLabel } from "../common/constants/opportunity-highlight-attraction.js";
import { opportunityEventKidsFacilityLabel } from "../common/constants/opportunity-kids-facility.js";
import { opportunityEventParentFacilityLabel } from "../common/constants/opportunity-parent-facility.js";
import { opportunityEventParkingProvisionLabel } from "../common/constants/opportunity-parking-provision.js";
import { opportunityEventSeasonalHighlightLabel } from "../common/constants/opportunity-seasonal-highlight.js";
import { opportunityEventSeasonalTagLabel } from "../common/constants/opportunity-seasonal-tag.js";
import { opportunityEventVenueSettingLabel } from "../common/constants/opportunity-venue-setting.js";
import { opportunityTerrainLabel } from "../common/constants/opportunity-terrain.js";
import { opportunityEventThemeVariantLabel } from "../common/constants/opportunity-theme-variant.js";
import { opportunityEventThemeLabel } from "../common/constants/opportunity-theme.js";

const decimalToNumber = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
};

export const enrichOpportunityRouteResponse = (
  row: EnrichableOpportunityRoute,
): OpportunityRouteResponse => {
  const routeSuitabilitySlugs = row.routeSuitabilitySlugs ?? [];
  const terrainTypeSlugs = row.terrainTypeSlugs ?? [];
  const generalFacilitySlugs = row.generalFacilitySlugs ?? [];
  const kidsFacilitySlugs = row.kidsFacilitySlugs ?? [];
  const parentFacilitySlugs = row.parentFacilitySlugs ?? [];
  const dogFacilitySlugs = row.dogFacilitySlugs ?? [];
  const extraKitSlugs = row.extraKitSlugs ?? [];
  const seasonalHighlightSlugs = row.seasonalHighlightSlugs ?? [];
  const highlightAttractionSlugs = row.highlightAttractionSlugs ?? [];

  const response: OpportunityRouteResponse = {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    routeDistanceMiles: decimalToNumber(row.routeDistanceMiles),
    startPointPostCode: row.startPointPostCode,
    interestTags: row.interestTags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    adultCost: decimalToNumber(row.adultCost),
    childCost: decimalToNumber(row.childCost),
    infantCost: decimalToNumber(row.infantCost),
    theme: {
      slug: row.themeSlug,
      label: opportunityEventThemeLabel(row.themeSlug),
    },
    routeSuitabilities: routeSuitabilitySlugs.map((slug: string) => ({
      slug,
      label: opportunityRouteSuitabilityLabel(slug),
    })),
    terrainTypes: terrainTypeSlugs.map((slug: string) => ({
      slug,
      label: opportunityTerrainLabel(slug),
    })),
    generalFacilities: generalFacilitySlugs.map((slug: string) => ({
      slug,
      label: opportunityEventGeneralFacilityLabel(slug),
    })),
    kidsFacilities: kidsFacilitySlugs.map((slug: string) => ({
      slug,
      label: opportunityEventKidsFacilityLabel(slug),
    })),
    parentFacilities: parentFacilitySlugs.map((slug: string) => ({
      slug,
      label: opportunityEventParentFacilityLabel(slug),
    })),
    dogFacilities: dogFacilitySlugs.map((slug: string) => ({
      slug,
      label: opportunityRouteDogFacilityLabel(slug),
    })),
    extraKits: extraKitSlugs.map((slug: string) => ({
      slug,
      label: opportunityEventExtraKitLabel(slug),
    })),
    seasonalHighlights: seasonalHighlightSlugs.map((slug: string) => ({
      slug,
      label: opportunityEventSeasonalHighlightLabel(slug),
    })),
    highlightAttractions: highlightAttractionSlugs.map((slug: string) => ({
      slug,
      label: opportunityEventHighlightAttractionLabel(slug),
    })),
  };

  if (row.themeVariantSlug) {
    response.themeVariant = {
      slug: row.themeVariantSlug,
      label: opportunityEventThemeVariantLabel(row.themeVariantSlug),
    };
  }
  if (row.routeTypeSlug) {
    response.routeType = {
      slug: row.routeTypeSlug,
      label: opportunityRouteTypeLabel(row.routeTypeSlug),
    };
  }
  if (row.difficultyRatingSlug) {
    response.difficultyRating = {
      slug: row.difficultyRatingSlug,
      label: opportunityRouteDifficultyLabel(row.difficultyRatingSlug),
    };
  }
  if (row.activityGroupSlug) {
    response.activityGroup = {
      slug: row.activityGroupSlug,
      label: opportunityEventActivityGroupLabel(row.activityGroupSlug),
    };
  }
  if (row.parkingProvisionSlug) {
    response.parkingProvision = {
      slug: row.parkingProvisionSlug,
      label: opportunityEventParkingProvisionLabel(row.parkingProvisionSlug),
    };
  }
  if (row.venueSettingSlug) {
    response.venueSetting = {
      slug: row.venueSettingSlug,
      label: opportunityEventVenueSettingLabel(row.venueSettingSlug),
    };
  }
  if (row.seasonalTagSlug) {
    response.seasonalTag = {
      slug: row.seasonalTagSlug,
      label: opportunityEventSeasonalTagLabel(row.seasonalTagSlug),
    };
  }

  return response;
};
