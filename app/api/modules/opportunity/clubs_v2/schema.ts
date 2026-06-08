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

export const createOpportunityClubV2Schema = yup.object({
  clubName: yup.string().trim().required("clubName is required"),
  themeSlug: yup.string().trim().required("themeSlug is required"),
  themeVariantSlug: yup
    .string()
    .trim()
    .required("themeVariantSlug is required"),
  opportunityType: yup
    .string()
    .oneOf(["venue", "event", "club", "route"])
    .optional()
    .default("club"),
  clubDescription: sOpt(),
  clubFormat: sOpt(),
  clubCommittment: sOpt(),
  clubFrequency: sOpt(),
  clubAddressLine1: sOpt(),
  clubAddressLine2: sOpt(),
  clubCityTown: sOpt(),
  clubStateRegionProvince: sOpt(),
  clubPostcode: sOpt(),
  clubCountry: sOpt(),
  latitude: sOpt(),
  longitude: sOpt(),
  clubStartDate: isoDateOpt,
  clubEndDate: isoDateOpt,
  clubRepeatSession: bOpt(),
  clubDailyFixedSessionTotal: iOpt(),
  clubDailyFixedSessionSchedule: sOpt(),
  clubDailySchedule: sOpt(),
  clubFixedDailyTimings: bOpt(),
  clubDailyStartTime: sOpt(),
  clubDailyEndTime: sOpt(),
  clubMixedTimingsMondayStartTime: sOpt(),
  clubMixedTimingsMondayEndTime: sOpt(),
  clubMixedTimingsTuesdayStartTime: sOpt(),
  clubMixedTimingsTuesdayEndTime: sOpt(),
  clubMixedTimingsWednesdayStartTime: sOpt(),
  clubMixedTimingsWednesdayEndTime: sOpt(),
  clubMixedTimingsThursdayStartTime: sOpt(),
  clubMixedTimingsThursdayEndTime: sOpt(),
  clubMixedTimingsFridayStartTime: sOpt(),
  clubMixedTimingsFridayEndTime: sOpt(),
  clubMixedTimingsSaturdayStartTime: sOpt(),
  clubMixedTimingsSaturdayEndTime: sOpt(),
  clubMixedTimingsSundayStartTime: sOpt(),
  clubMixedTimingsSundayEndTime: sOpt(),
  clubMultiSessionMondaySessionTotal: iOpt(),
  clubMultiSessionMondaySchedule: sOpt(),
  clubMultiSessionTuesdaySessionTotal: iOpt(),
  clubMultiSessionTuesdaySchedule: sOpt(),
  clubMultiSessionWednesdaySessionTotal: iOpt(),
  clubMultiSessionWednesdaySchedule: sOpt(),
  clubMultiSessionThursdaySessionTotal: iOpt(),
  clubMultiSessionThursdaySchedule: sOpt(),
  clubMultiSessionFridaySessionTotal: iOpt(),
  clubMultiSessionFridaySchedule: sOpt(),
  clubMultiSessionSaturdaySessionTotal: iOpt(),
  clubMultiSessionSaturdaySchedule: sOpt(),
  clubMultiSessionSundaySessionTotal: iOpt(),
  clubMultiSessionSundaySchedule: sOpt(),
  clubMonthlySchedule: sOpt(),
  clubFixedMonthOccurance: sOpt(),
  clubMonthlyOccurance: sOpt(),
  clubMonthlyFixedDates: sOpt(),
  ticketingRequirement: bOpt(),
  clubBookingProvision: sOpt(),
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
  clubParkingProvision: sOpt(),
  clubGeneralFacilities: sOpt(),
  clubChildFacilities: sOpt(),
  clubAdultFacilities: sOpt(),
  clubAgeSuitabilityUnder1S: bOpt(),
  clubAgeSuitability1To2Years: bOpt(),
  clubAgeSuitability3To4Years: bOpt(),
  clubAgeSuitability5To7Years: bOpt(),
  clubAgeSuitability8To12Years: bOpt(),
  clubAgeSuitabilityOver13Years: bOpt(),
  clubAgeSuitabilityAdults: bOpt(),
  clubActivityGroup: sOpt(),
  clubPhysicalSetting: sOpt(),
  clubSkillArea: sOpt(),
  clubSkillAreaVariant: sOpt(),
  clubAbilityLevel: sOpt(),
  clubInterestTags: sOpt(),
  clubSeasonalTag: sOpt(),
  clubSeasonalHighlights: sOpt(),
  clubAttractions: sOpt(),
  clubExtraKit: sOpt(),
  image: sOpt(),
});

export type CreateOpportunityClubV2Body = yup.InferType<
  typeof createOpportunityClubV2Schema
>;

export { validateBody };
