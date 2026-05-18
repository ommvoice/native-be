import * as yup from "yup";
import { validateBody } from "../events/schema.js";

const sOpt = () =>
  yup
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v));

const bOpt = () => yup.boolean().optional().nullable();

const iOpt = () => yup.number().integer().optional().nullable();

const isoDateOpt = yup
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v === "" ? null : v))
  .test(
    "iso-date",
    "must be a valid ISO date string",
    (v) => v == null || !Number.isNaN(Date.parse(v)),
  );

export const createOpportunityVenueV2Schema = yup.object({
  eventName: yup.string().trim().required("eventName is required"),
  themeSlug: yup.string().trim().required("themeSlug is required"),
  themeVariantSlug: yup
    .string()
    .trim()
    .required("themeVariantSlug is required"),
  opportunityType: yup
    .string()
    .oneOf(["venue", "event", "club", "route"])
    .optional()
    .default("event"),
  eventActivityGroup: sOpt(),
  eventType: sOpt(),
  eventDescription: sOpt(),
  eventAddressLine1: sOpt(),
  eventAddressLine2: sOpt(),
  eventCity: sOpt(),
  eventRegion: sOpt(),
  eventPostcode: sOpt(),
  eventCountry: sOpt(),
  latitude: sOpt(),
  longitude: sOpt(),
  eventPhysicalSetting: sOpt(),
  eventDetailedWeatherSuitability: sOpt(),
  eventStartDate: isoDateOpt,
  eventEndDate: isoDateOpt,
  eventDaysTotal: iOpt(),
  eventDailyMultiSession: bOpt(),
  eventTimetableWeekly: sOpt(),
  eventDailyFixedTimings: bOpt(),
  eventDailyFixedStartTime: sOpt(),
  eventDailyFixedEndTime: sOpt(),
  eventDailyMultiSessionTotal: iOpt(),
  eventDailyMultiSessionTimings: sOpt(),
  eventWeeklyFixedStartTime: sOpt(),
  eventWeeklyFixedEndTime: sOpt(),
  eventMixedTimingsMondayStart: sOpt(),
  eventMixedTimingsMondayEnd: sOpt(),
  eventMixedTimingsTuesdayStart: sOpt(),
  eventMixedTimingsTuesdayEnd: sOpt(),
  eventMixedTimingsWednesdayStart: sOpt(),
  eventMixedTimingsWednesdayEnd: sOpt(),
  eventMixedTimingsThursdayStart: sOpt(),
  eventMixedTimingsThursdayEnd: sOpt(),
  eventMixedTimingsFridayStart: sOpt(),
  eventMixedTimingsFridayEnd: sOpt(),
  eventMixedTimingsSaturdayStart: sOpt(),
  eventMixedTimingsSaturdayEnd: sOpt(),
  eventMixedTimingsSundayStart: sOpt(),
  eventMixedTimingsSundayEnd: sOpt(),
  ticketSalesStartDate: isoDateOpt,
  eventEntryCost: bOpt(),
  ticketingRequirement: bOpt(),
  eventBookingType: sOpt(),
  ticketingVariants: sOpt(),
  ticketVariantDefinitionBaby: sOpt(),
  ticketVariantBabyPrice: sOpt(),
  ticketVariantDefinitionFixedChild: sOpt(),
  ticketVariantFixedChildPrice: sOpt(),
  ticketVariantDefinitionYoungChild: sOpt(),
  ticketVariantYoungChildPrice: sOpt(),
  ticketVariantDefinitionOlderChild: sOpt(),
  ticketVariantOlderChildPrice: sOpt(),
  ticketVariantDefinitionAdult: sOpt(),
  ticketVariantAdultPrice: sOpt(),
  ticketVariantDefinitionConcession: sOpt(),
  ticketVariantConcessionPrice: sOpt(),
  ticketVariantDefinitionGroup: sOpt(),
  ticketVariantGroupPrice: sOpt(),
  eventParkingProvision: sOpt(),
  eventGeneralFacilities: sOpt(),
  eventChildFacilities: sOpt(),
  eventAdultFacilities: sOpt(),
  eventAgeSuitabilityUnder1S: bOpt(),
  eventAgeSuitability1To2Years: bOpt(),
  eventAgeSuitability3To4Years: bOpt(),
  eventAgeSuitability5To7Years: bOpt(),
  eventAgeSuitability8To12Years: bOpt(),
  eventAgeSuitabilityOver13Years: bOpt(),
  eventAgeSuitabilityAdults: bOpt(),
  eventInterestTags: sOpt(),
  eventSeasonalTags: sOpt(),
  eventSeasonalHighlights: sOpt(),
  eventHighlights: sOpt(),
  eventExtraKit: sOpt(),
  eventSkillArea: sOpt(),
  eventSkillAreaVariant: sOpt(),
  eventAbilityLevel: sOpt(),
  image: sOpt(),
});

export type CreateOpportunityVenueV2Body = yup.InferType<
  typeof createOpportunityVenueV2Schema
>;

export { validateBody };
