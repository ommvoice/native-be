import { opportunityEventActivityGroupLabel } from "../common/constants/opportunity-activity-group.js";
import { opportunityEventAgeSuitabilityLabel } from "../common/constants/opportunity-age-suitability.js";
import { opportunityEventExtraKitLabel } from "../common/constants/opportunity-extra-kit.js";
import { opportunityEventGeneralFacilityLabel } from "../common/constants/opportunity-general-facility.js";
import { opportunityEventHighlightAttractionLabel } from "../common/constants/opportunity-highlight-attraction.js";
import { opportunityEventKidsFacilityLabel } from "../common/constants/opportunity-kids-facility.js";
import { opportunityEventParentFacilityLabel } from "../common/constants/opportunity-parent-facility.js";
import { opportunityEventParkingProvisionLabel } from "../common/constants/opportunity-parking-provision.js";
import { opportunityEventSeasonalHighlightLabel } from "../common/constants/opportunity-seasonal-highlight.js";
import { opportunityEventSeasonalTagLabel } from "../common/constants/opportunity-seasonal-tag.js";
import { opportunityEventVenueSettingLabel } from "../common/constants/opportunity-venue-setting.js";
import { opportunityRouteDogFacilityLabel } from "../routes/constants/dog-facility.js";
import { opportunityTerrainLabel } from "../common/constants/opportunity-terrain.js";
import { opportunityEventThemeVariantLabel } from "../common/constants/opportunity-theme-variant.js";
import { opportunityEventThemeLabel } from "../common/constants/opportunity-theme.js";
import type {
  EnrichableOpportunityVenue,
  OpportunityVenueResponse,
} from "./types.js";

const decimalToNumber = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
};

export const enrichOpportunityVenueResponse = (
  row: EnrichableOpportunityVenue,
): OpportunityVenueResponse => {
  const response: OpportunityVenueResponse = {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    venuePostCode: row.venuePostcode,
    openingDaysAndTimes: row.openingDaysAndTimes,
    openingExclusions: row.openingExclusions,
    interestTags: row.interestTags,
    estimatedTimeToSpend: row.estimatedTimeToSpend,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    adultCost: decimalToNumber(row.adultCost),
    childCost: decimalToNumber(row.childCost),
    infantCost: decimalToNumber(row.infantCost),
    theme: {
      slug: row.themeSlug,
      label: opportunityEventThemeLabel(row.themeSlug),
    },
    generalFacilities: row.generalFacilitySlugs.map((slug) => ({
      slug,
      label: opportunityEventGeneralFacilityLabel(slug),
    })),
    kidsFacilities: row.kidsFacilitySlugs.map((slug) => ({
      slug,
      label: opportunityEventKidsFacilityLabel(slug),
    })),
    parentFacilities: row.parentFacilitySlugs.map((slug) => ({
      slug,
      label: opportunityEventParentFacilityLabel(slug),
    })),
    dogFacilities: (row.dogFacilitySlugs ?? []).map((slug) => ({
      slug,
      label: opportunityRouteDogFacilityLabel(slug),
    })),
    ageSuitabilities: row.ageSuitabilitySlugs.map((slug) => ({
      slug,
      label: opportunityEventAgeSuitabilityLabel(slug),
    })),
    extraKits: row.extraKitSlugs.map((slug) => ({
      slug,
      label: opportunityEventExtraKitLabel(slug),
    })),
    seasonalHighlights: row.seasonalHighlightSlugs.map((slug) => ({
      slug,
      label: opportunityEventSeasonalHighlightLabel(slug),
    })),
    highlightAttractions: row.highlightAttractionSlugs.map((slug) => ({
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
  if (row.activityGroupSlug) {
    response.activityGroup = {
      slug: row.activityGroupSlug,
      label: opportunityEventActivityGroupLabel(row.activityGroupSlug),
    };
  }
  if (row.terrainTypeSlug) {
    response.terrainType = {
      slug: row.terrainTypeSlug,
      label: opportunityTerrainLabel(row.terrainTypeSlug),
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
