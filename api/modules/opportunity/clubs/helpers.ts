import { opportunityClubCommitmentLabel } from "./constants/commitment.js";
import { opportunityClubDayOfWeekLabel } from "./constants/day-of-week.js";
import { opportunityClubFormatLabel } from "./constants/format.js";
import { opportunityClubFrequencyLabel } from "./constants/frequency.js";
import type {
  EnrichableOpportunityClub,
  OpportunityClubResponse,
} from "./types.js";
import { opportunityEventAbilityLevelLabel } from "../common/constants/opportunity-ability-level.js";
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
import { opportunityEventSkillAreaLabel } from "../common/constants/opportunity-skill-area.js";
import { opportunityEventVenueSettingLabel } from "../common/constants/opportunity-venue-setting.js";
import { opportunityEventThemeVariantLabel } from "../common/constants/opportunity-theme-variant.js";
import { opportunityEventThemeLabel } from "../common/constants/opportunity-theme.js";

const decimalCostToNumber = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
};

export const enrichOpportunityClubResponse = (
  row: EnrichableOpportunityClub,
): OpportunityClubResponse => {
  const generalFacilitySlugs = row.generalFacilitySlugs ?? [];
  const kidsFacilitySlugs = row.kidsFacilitySlugs ?? [];
  const parentFacilitySlugs = row.parentFacilitySlugs ?? [];
  const ageSuitabilitySlugs = row.ageSuitabilitySlugs ?? [];
  const extraKitSlugs = row.extraKitSlugs ?? [];
  const seasonalHighlightSlugs = row.seasonalHighlightSlugs ?? [];
  const highlightAttractionSlugs = row.highlightAttractionSlugs ?? [];

  const response: OpportunityClubResponse = {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    venuePostCode: row.venuePostCode,
    startTime: row.startTime,
    finishTime: row.finishTime,
    interestTags: row.interestTags,
    skillAreaVariant: row.skillAreaVariant,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    adultCost: decimalCostToNumber(row.adultCost),
    childCost: decimalCostToNumber(row.childCost),
    infantCost: decimalCostToNumber(row.infantCost),
    theme: {
      slug: row.themeSlug,
      label: opportunityEventThemeLabel(row.themeSlug),
    },
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
    ageSuitabilities: ageSuitabilitySlugs.map((slug: string) => ({
      slug,
      label: opportunityEventAgeSuitabilityLabel(slug),
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
  if (row.dayOfWeekSlug) {
    response.dayOfWeek = {
      slug: row.dayOfWeekSlug,
      label: opportunityClubDayOfWeekLabel(row.dayOfWeekSlug),
    };
  }
  if (row.activityGroupSlug) {
    response.activityGroup = {
      slug: row.activityGroupSlug,
      label: opportunityEventActivityGroupLabel(row.activityGroupSlug),
    };
  }
  if (row.clubFormatSlug) {
    response.clubFormat = {
      slug: row.clubFormatSlug,
      label: opportunityClubFormatLabel(row.clubFormatSlug),
    };
  }
  if (row.clubFrequencySlug) {
    response.clubFrequency = {
      slug: row.clubFrequencySlug,
      label: opportunityClubFrequencyLabel(row.clubFrequencySlug),
    };
  }
  if (row.commitmentSlug) {
    response.commitment = {
      slug: row.commitmentSlug,
      label: opportunityClubCommitmentLabel(row.commitmentSlug),
    };
  }
  if (row.skillAreaSlug) {
    response.skillArea = {
      slug: row.skillAreaSlug,
      label: opportunityEventSkillAreaLabel(row.skillAreaSlug),
    };
  }
  if (row.abilityLevelSlug) {
    response.abilityLevel = {
      slug: row.abilityLevelSlug,
      label: opportunityEventAbilityLevelLabel(row.abilityLevelSlug),
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
