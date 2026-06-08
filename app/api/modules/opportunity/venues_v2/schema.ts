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

export const createOpportunityVenuesV2Schema = yup.object({
  venueName: yup.string().trim().required("venueName is required"),
  themeSlug: yup.string().trim().required("themeSlug is required"),
  themeVariantSlug: yup
    .string()
    .trim()
    .required("themeVariantSlug is required"),
  venueActivityGroup: sOpt(),
  venueDescription: sOpt(),
  venueAddressLine1: sOpt(),
  venueAddressLine2: sOpt(),
  venueCity: sOpt(),
  venueRegion: sOpt(),
  venuePostcode: sOpt(),
  latitude: sOpt(),
  longitude: sOpt(),
  venueCountry: sOpt(),
  venueSchedulePattern: sOpt(),
  venueFixedDailyTimings: bOpt(),
  venueFixedTimingsStartTime: sOpt(),
  venueFixedTimingsEndTime: sOpt(),
  venueMixedTimingsMondayStart: sOpt(),
  venueMixedTimingsMondayEnd: sOpt(),
  venueMixedTimingsTuesdayStart: sOpt(),
  venueMixedTimingsTuesdayEnd: sOpt(),
  venueMixedTimingsWednesdayStart: sOpt(),
  venueMixedTimingsWednesdayEnd: sOpt(),
  venueMixedTimingsThursdayStart: sOpt(),
  venueMixedTimingsThursdayEnd: sOpt(),
  venueMixedTimingsFridayStart: sOpt(),
  venueMixedTimingsFridayEnd: sOpt(),
  venueMixedTimingsSaturdayStart: sOpt(),
  venueMixedTimingsSaturdayEnd: sOpt(),
  venueMixedTimingsSundayStart: sOpt(),
  venueMixedTimingsSundayEnd: sOpt(),
  venueEntryCost: bOpt(),
  ticketingRequirement: bOpt(),
  venueBookingType: sOpt(),
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
  venueGeneralFacilities: sOpt(),
  venueChildFacilities: sOpt(),
  venueAdultFacilities: sOpt(),
  venueDogFacilities: sOpt(),
  venueParkingProvision: sOpt(),
  venueAgeSuitabilityUnder1Years: bOpt(),
  venueAgeSuitability1To2Years: bOpt(),
  venueAgeSuitability3To4Years: bOpt(),
  venueAgeSuitability5To7Years: bOpt(),
  venueAgeSuitability8To12Years: bOpt(),
  venueAgeSuitabilityOver13Years: bOpt(),
  venueAgeSuitabilityAdults: bOpt(),
  venuePhysicalSetting: sOpt(),
  venueDetailedWeatherSuitability: sOpt(),
  venueEstimatedDuration: sOpt(),
  venueInterestTags: sOpt(),
  venueSeasonalTag: sOpt(),
  venueSeasonalHighlights: sOpt(),
  venueAttractions: sOpt(),
  venueExtraKit: sOpt(),
  image: sOpt(),
});

export type CreateOpportunityVenuesV2Body = yup.InferType<
  typeof createOpportunityVenuesV2Schema
>;

export { validateBody };
