import * as yup from "yup";
import { OPPORTUNITY_EVENT_ACTIVITY_GROUP_SLUGS } from "../common/constants/opportunity-activity-group.js";
import { OPPORTUNITY_EVENT_EXTRA_KIT_SLUGS } from "../common/constants/opportunity-extra-kit.js";
import { OPPORTUNITY_EVENT_GENERAL_FACILITY_SLUGS } from "../common/constants/opportunity-general-facility.js";
import { OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_SLUGS } from "../common/constants/opportunity-highlight-attraction.js";
import { OPPORTUNITY_EVENT_KIDS_FACILITY_SLUGS } from "../common/constants/opportunity-kids-facility.js";
import { OPPORTUNITY_EVENT_PARENT_FACILITY_SLUGS } from "../common/constants/opportunity-parent-facility.js";
import { OPPORTUNITY_EVENT_PARKING_PROVISION_SLUGS } from "../common/constants/opportunity-parking-provision.js";
import { OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_SLUGS } from "../common/constants/opportunity-seasonal-highlight.js";
import { OPPORTUNITY_EVENT_SEASONAL_TAG_SLUGS } from "../common/constants/opportunity-seasonal-tag.js";
import { OPPORTUNITY_EVENT_VENUE_SETTING_SLUGS } from "../common/constants/opportunity-venue-setting.js";
import { OPPORTUNITY_EVENT_THEME_VARIANT_SLUGS } from "../common/constants/opportunity-theme-variant.js";
import { OPPORTUNITY_EVENT_THEME_SLUGS } from "../common/constants/opportunity-theme.js";
import { OPPORTUNITY_TERRAIN_SLUGS } from "../common/constants/opportunity-terrain.js";
import { OPPORTUNITY_ROUTE_DIFFICULTY_SLUGS } from "./constants/difficulty-rating.js";
import { OPPORTUNITY_ROUTE_DOG_FACILITY_SLUGS } from "./constants/dog-facility.js";
import { OPPORTUNITY_ROUTE_SUITABILITY_SLUGS } from "./constants/route-suitability.js";
import { OPPORTUNITY_ROUTE_TYPE_SLUGS } from "./constants/route-type.js";

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

const optionalRouteTypeSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-route-type",
    "routeTypeSlug must be a known route type",
    (v) =>
      v == null ||
      OPPORTUNITY_ROUTE_TYPE_SLUGS.includes(
        v as (typeof OPPORTUNITY_ROUTE_TYPE_SLUGS)[number],
      ),
  );

const optionalDifficultyRatingSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-difficulty-rating",
    "difficultyRatingSlug must be a known difficulty rating",
    (v) =>
      v == null ||
      OPPORTUNITY_ROUTE_DIFFICULTY_SLUGS.includes(
        v as (typeof OPPORTUNITY_ROUTE_DIFFICULTY_SLUGS)[number],
      ),
  );

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

export const createOpportunityRouteSchema = yup.object({
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
  routeTypeSlug: optionalRouteTypeSlug,
  routeDistanceMiles: yup.number().optional().nullable(),
  routeSuitabilitySlugs: slugArray(
    OPPORTUNITY_ROUTE_SUITABILITY_SLUGS,
    "routeSuitabilitySlugs must contain only known route suitability slugs",
  ),
  terrainTypeSlugs: slugArray(
    OPPORTUNITY_TERRAIN_SLUGS,
    "terrainTypeSlugs must contain only known terrain type slugs",
  ),
  difficultyRatingSlug: optionalDifficultyRatingSlug,
  activityGroupSlug: optionalActivityGroupSlug,
  startPointPostCode: yup.string().trim().max(10).optional().nullable(),
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
  dogFacilitySlugs: slugArray(
    OPPORTUNITY_ROUTE_DOG_FACILITY_SLUGS,
    "dogFacilitySlugs must contain only known dog facility slugs",
  ),
  extraKitSlugs: slugArray(
    OPPORTUNITY_EVENT_EXTRA_KIT_SLUGS,
    "extraKitSlugs must contain only known extra kit slugs",
  ),
  adultCost: yup.number().optional().nullable(),
  childCost: yup.number().optional().nullable(),
  infantCost: yup.number().optional().nullable(),
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

export type CreateOpportunityRouteBody = yup.InferType<
  typeof createOpportunityRouteSchema
>;

export { validateBody } from "../events/schema.js";
