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

export const createOpportunityRouteV2Schema = yup.object({
  routeName: yup.string().trim().required("routeName is required"),
  themeSlug: yup.string().trim().required("themeSlug is required"),
  themeVariantSlug: yup
    .string()
    .trim()
    .required("themeVariantSlug is required"),
  opportunityType: yup
    .string()
    .oneOf(["venue", "event", "club", "route"])
    .optional()
    .default("route"),
  routeActivityGrouping: sOpt(),
  routeDescription: sOpt(),
  routeType: sOpt(),
  routeDistance: sOpt(),
  routeTerrainType: sOpt(),
  routeDifficulty: sOpt(),
  routeAddressLine1: sOpt(),
  routeAddressLine2: sOpt(),
  routeRegion: sOpt(),
  routePostcode: sOpt(),
  latitude: sOpt(),
  longitude: sOpt(),
  routeCountry: sOpt(),
  routeParkingProvision: sOpt(),
  routeGeneralFacilities: sOpt(),
  routeChildFacilities: sOpt(),
  routeAdultFacilities: sOpt(),
  routeDogFacilities: sOpt(),
  routeAgeSuitabilityUnder1S: bOpt(),
  routeAgeSuitability1To2Years: bOpt(),
  routeAgeSuitability3To4Years: bOpt(),
  routeAgeSuitability5To7Years: bOpt(),
  routeAgeSuitability8To12Years: bOpt(),
  routeAgeSuitabilityOver13Years: bOpt(),
  routeAgeSuitabilityAdults: bOpt(),
  routePhysicalSetting: sOpt(),
  routeDetailedWeatherSuitability: sOpt(),
  routeEstimatedDuration: sOpt(),
  routeInterestTags: sOpt(),
  routeSeasonalTag: sOpt(),
  routeSeasonalHighlights: sOpt(),
  routeAttractions: sOpt(),
  routeExtraKit: sOpt(),
  image: sOpt(),
});

export type CreateOpportunityRouteV2Body = yup.InferType<
  typeof createOpportunityRouteV2Schema
>;

export { validateBody };
