import * as yup from "yup";
import type { Request, Response, NextFunction } from "express";
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
import { OPPORTUNITY_EVENT_TYPE_SLUGS } from "../common/constants/opportunity-types.js";

const optionalSlug = yup.string().trim().optional().nullable();

const optionalParkingProvisionSlug = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "known-parking-provision",
    "parkingProvisionSlug must be a known opportunity event parking provision",
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
    "venueSettingSlug must be a known opportunity event venue setting",
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
    "skillAreaSlug must be a known opportunity event skill area",
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
    "abilityLevelSlug must be a known opportunity event ability level",
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
    "seasonalTagSlug must be a known opportunity event seasonal tag",
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
    "activityGroupSlug must be a known opportunity event activity group",
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
    "themeVariantSlug must be a known opportunity event theme variant",
    (v) =>
      v == null ||
      OPPORTUNITY_EVENT_THEME_VARIANT_SLUGS.includes(
        v as (typeof OPPORTUNITY_EVENT_THEME_VARIANT_SLUGS)[number],
      ),
  );

const timeHm = yup
  .string()
  .trim()
  .matches(/^\d{2}:\d{2}$/, "Must be HH:mm")
  .optional()
  .nullable();

const generalFacilitySlugArray = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .required()
      .oneOf(
        [...OPPORTUNITY_EVENT_GENERAL_FACILITY_SLUGS],
        "generalFacilitySlugs must contain only known general facility slugs",
      ),
  )
  .optional();

const kidsFacilitySlugArray = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .required()
      .oneOf(
        [...OPPORTUNITY_EVENT_KIDS_FACILITY_SLUGS],
        "kidsFacilitySlugs must contain only known kids facility slugs",
      ),
  )
  .optional();

const parentFacilitySlugArray = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .required()
      .oneOf(
        [...OPPORTUNITY_EVENT_PARENT_FACILITY_SLUGS],
        "parentFacilitySlugs must contain only known parent facility slugs",
      ),
  )
  .optional();

const ageSuitabilitySlugArray = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .required()
      .oneOf(
        [...OPPORTUNITY_EVENT_AGE_SUITABILITY_SLUGS],
        "ageSuitabilitySlugs must contain only known age suitability slugs",
      ),
  )
  .optional();

const extraKitSlugArray = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .required()
      .oneOf(
        [...OPPORTUNITY_EVENT_EXTRA_KIT_SLUGS],
        "extraKitSlugs must contain only known extra kit slugs",
      ),
  )
  .optional();

const seasonalHighlightSlugArray = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .required()
      .oneOf(
        [...OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_SLUGS],
        "seasonalHighlightSlugs must contain only known seasonal highlight slugs",
      ),
  )
  .optional();

const highlightAttractionSlugArray = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .required()
      .oneOf(
        [...OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_SLUGS],
        "highlightAttractionSlugs must contain only known highlight attraction slugs",
      ),
  )
  .optional();

export const createOpportunityEventSchema = yup.object({
  name: yup.string().trim().required("name is required"),
  description: yup.string().trim().optional().nullable(),
  themeSlug: yup
    .string()
    .trim()
    .required("themeSlug is required")
    .oneOf(
      [...OPPORTUNITY_EVENT_THEME_SLUGS],
      "themeSlug must be a known opportunity event theme",
    ),
  themeVariantSlug: optionalThemeVariantSlug,
  eventTypeSlug: yup
    .string()
    .trim()
    .required("eventTypeSlug is required")
    .oneOf(
      [...OPPORTUNITY_EVENT_TYPE_SLUGS],
      "eventTypeSlug must be a known opportunity event type",
    ),
  activityGroupSlug: optionalActivityGroupSlug,
  startDate: yup
    .string()
    .trim()
    .optional()
    .nullable()
    .test(
      "iso-date",
      "startDate must be a valid ISO date string",
      (v) => !v || !Number.isNaN(Date.parse(v)),
    ),
  endDate: yup
    .string()
    .trim()
    .optional()
    .nullable()
    .test(
      "iso-date",
      "endDate must be a valid ISO date string",
      (v) => !v || !Number.isNaN(Date.parse(v)),
    ),
  startTime: timeHm,
  finishTime: timeHm,
  venuePostCode: yup.string().trim().max(10).optional().nullable(),
  parkingProvisionSlug: optionalParkingProvisionSlug,
  venueSettingSlug: optionalVenueSettingSlug,
  generalFacilitySlugs: generalFacilitySlugArray,
  kidsFacilitySlugs: kidsFacilitySlugArray,
  parentFacilitySlugs: parentFacilitySlugArray,
  adultCost: yup.number().optional().nullable(),
  childCost: yup.number().optional().nullable(),
  infantCost: yup.number().optional().nullable(),
  ageSuitabilitySlugs: ageSuitabilitySlugArray,
  skillAreaSlug: optionalSkillAreaSlug,
  skillAreaVariant: yup.string().trim().optional().nullable(),
  abilityLevelSlug: optionalAbilityLevelSlug,
  extraKitSlugs: extraKitSlugArray,
  interestTags: yup.string().trim().optional().nullable(),
  seasonalTagSlug: optionalSeasonalTagSlug,
  seasonalHighlightSlugs: seasonalHighlightSlugArray,
  highlightAttractionSlugs: highlightAttractionSlugArray,
});

export type CreateOpportunityEventBody = yup.InferType<
  typeof createOpportunityEventSchema
>;

export const validateBody =
  (schema: yup.ObjectSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.validate(req.body, { stripUnknown: true });
      next();
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "errors" in err &&
        Array.isArray((err as { errors?: string[] }).errors)
          ? (err as { errors: string[] }).errors[0]
          : "Invalid request";
      res.status(400).json({ error: message });
    }
  };
