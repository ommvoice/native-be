import * as yup from "yup";
import { OPPORTUNITY_EVENT_AGE_SUITABILITY_SLUGS } from "../common/constants/opportunity-age-suitability.js";
import { OPPORTUNITY_EVENT_EXTRA_KIT_SLUGS } from "../common/constants/opportunity-extra-kit.js";
import { OPPORTUNITY_EVENT_ABILITY_LEVEL_SLUGS } from "../common/constants/opportunity-ability-level.js";
import { OPPORTUNITY_EVENT_ACTIVITY_GROUP_SLUGS } from "../common/constants/opportunity-activity-group.js";
import { OPPORTUNITY_EVENT_GENERAL_FACILITY_SLUGS } from "../common/constants/opportunity-general-facility.js";
import { OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_SLUGS } from "../common/constants/opportunity-highlight-attraction.js";
import { OPPORTUNITY_EVENT_KIDS_FACILITY_SLUGS } from "../common/constants/opportunity-kids-facility.js";
import { OPPORTUNITY_EVENT_PARENT_FACILITY_SLUGS } from "../common/constants/opportunity-parent-facility.js";
import { OPPORTUNITY_EVENT_PARKING_PROVISION_SLUGS } from "../common/constants/opportunity-parking-provision.js";
import { OPPORTUNITY_EVENT_SKILL_AREA_SLUGS } from "../common/constants/opportunity-skill-area.js";
import { OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_SLUGS } from "../common/constants/opportunity-seasonal-highlight.js";
import { OPPORTUNITY_EVENT_SEASONAL_TAG_SLUGS } from "../common/constants/opportunity-seasonal-tag.js";
import { OPPORTUNITY_EVENT_VENUE_SETTING_SLUGS } from "../common/constants/opportunity-venue-setting.js";
import { OPPORTUNITY_EVENT_THEME_VARIANT_SLUGS } from "../common/constants/opportunity-theme-variant.js";
import { OPPORTUNITY_EVENT_THEME_SLUGS } from "../common/constants/opportunity-theme.js";
import { OPPORTUNITY_CLUB_COMMITMENT_SLUGS } from "./constants/commitment.js";
import { OPPORTUNITY_CLUB_DAY_OF_WEEK_SLUGS } from "./constants/day-of-week.js";
import { OPPORTUNITY_CLUB_FORMAT_SLUGS } from "./constants/format.js";
import { OPPORTUNITY_CLUB_FREQUENCY_SLUGS } from "./constants/frequency.js";

const optionalParkingProvisionSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-parking-provision",
    "parkingProvisionSlug must be a known parking provision",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_PARKING_PROVISION_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_PARKING_PROVISION_SLUGS)[number],
      ),
  );

const optionalVenueSettingSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-venue-setting",
    "venueSettingSlug must be a known venue setting",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_VENUE_SETTING_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_VENUE_SETTING_SLUGS)[number],
      ),
  );

const optionalSkillAreaSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-skill-area",
    "skillAreaSlug must be a known skill area",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_SKILL_AREA_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_SKILL_AREA_SLUGS)[number],
      ),
  );

const optionalAbilityLevelSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-ability-level",
    "abilityLevelSlug must be a known ability level",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_ABILITY_LEVEL_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_ABILITY_LEVEL_SLUGS)[number],
      ),
  );

const optionalSeasonalTagSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-seasonal-tag",
    "seasonalTagSlug must be a known seasonal tag",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_SEASONAL_TAG_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_SEASONAL_TAG_SLUGS)[number],
      ),
  );

const optionalActivityGroupSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-activity-group",
    "activityGroupSlug must be a known activity group",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_ACTIVITY_GROUP_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_ACTIVITY_GROUP_SLUGS)[number],
      ),
  );

const optionalThemeVariantSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-theme-variant",
    "themeVariantSlug must be a known theme variant",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_THEME_VARIANT_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_THEME_VARIANT_SLUGS)[number],
      ),
  );

const optionalDayOfWeekSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-day-of-week",
    "dayOfWeekSlug must be a known day of week",
    (v) =>
      v == null ||
      OPPORTUNITY_CLUB_DAY_OF_WEEK_SLUGS.includes(
        v as (typeof OPPORTUNITY_CLUB_DAY_OF_WEEK_SLUGS)[number],
      ),
  );

const optionalClubFormatSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-club-format",
    "clubFormatSlug must be a known club format",
    (v) =>
      v == null ||
      OPPORTUNITY_CLUB_FORMAT_SLUGS.includes(
        v as (typeof OPPORTUNITY_CLUB_FORMAT_SLUGS)[number],
      ),
  );

const optionalClubFrequencySlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-club-frequency",
    "clubFrequencySlug must be a known club frequency",
    (v) =>
      v == null ||
      OPPORTUNITY_CLUB_FREQUENCY_SLUGS.includes(
        v as (typeof OPPORTUNITY_CLUB_FREQUENCY_SLUGS)[number],
      ),
  );

const optionalCommitmentSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-commitment",
    "commitmentSlug must be a known commitment",
    (v) =>
      v == null ||
      OPPORTUNITY_CLUB_COMMITMENT_SLUGS.includes(
        v as (typeof OPPORTUNITY_CLUB_COMMITMENT_SLUGS)[number],
      ),
  );

const timeHm = yup
  .string()
  .trim()
  .matches(/^\d{2}:\d{2}$/, "Must be HH:mm")
  .optional()
  .nullable();

const slugArray = <const T extends readonly string[]>(
  slugs: T,
  message: string,
) =>
  yup
    .array()
    .of(
      yup
        .string()
        .trim()
        .required()
        .oneOf([...slugs], message),
    )
    .optional();

export const createOpportunityClubSchema = yup.object({
  name: yup.string().trim().required("name is required"),
  description: yup.string().trim().optional().nullable(),
  themeSlug: yup
    .string()
    .trim()
    .required("themeSlug is required")
    .oneOf(
      [...OPPORTUNITY_EVENT_THEME_SLUGS],
      "themeSlug must be a known opportunity theme",
    ),
  themeVariantSlug: optionalThemeVariantSlug,
  venuePostCode: yup.string().trim().max(10).optional().nullable(),
  startTime: timeHm,
  finishTime: timeHm,
  dayOfWeekSlug: optionalDayOfWeekSlug,
  activityGroupSlug: optionalActivityGroupSlug,
  clubFormatSlug: optionalClubFormatSlug,
  clubFrequencySlug: optionalClubFrequencySlug,
  commitmentSlug: optionalCommitmentSlug,
  skillAreaSlug: optionalSkillAreaSlug,
  skillAreaVariant: yup.string().trim().optional().nullable(),
  abilityLevelSlug: optionalAbilityLevelSlug,
  parkingProvisionSlug: optionalParkingProvisionSlug,
  venueSettingSlug: optionalVenueSettingSlug,
  generalFacilitySlugs: slugArray(
    OPPORTUNITY_EVENT_GENERAL_FACILITY_SLUGS,
    "generalFacilitySlugs must contain only known general facility slugs",
  ),
  kidsFacilitySlugs: slugArray(
    OPPORTUNITY_EVENT_KIDS_FACILITY_SLUGS,
    "kidsFacilitySlugs must contain only known kids facility slugs",
  ),
  parentFacilitySlugs: slugArray(
    OPPORTUNITY_EVENT_PARENT_FACILITY_SLUGS,
    "parentFacilitySlugs must contain only known parent facility slugs",
  ),
  adultCost: yup.number().optional().nullable(),
  childCost: yup.number().optional().nullable(),
  infantCost: yup.number().optional().nullable(),
  ageSuitabilitySlugs: slugArray(
    OPPORTUNITY_EVENT_AGE_SUITABILITY_SLUGS,
    "ageSuitabilitySlugs must contain only known age suitability slugs",
  ),
  extraKitSlugs: slugArray(
    OPPORTUNITY_EVENT_EXTRA_KIT_SLUGS,
    "extraKitSlugs must contain only known extra kit slugs",
  ),
  interestTags: yup.string().trim().optional().nullable(),
  seasonalTagSlug: optionalSeasonalTagSlug,
  seasonalHighlightSlugs: slugArray(
    OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_SLUGS,
    "seasonalHighlightSlugs must contain only known seasonal highlight slugs",
  ),
  highlightAttractionSlugs: slugArray(
    OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_SLUGS,
    "highlightAttractionSlugs must contain only known highlight attraction slugs",
  ),
});

export type CreateOpportunityClubBody = yup.InferType<
  typeof createOpportunityClubSchema
>;
