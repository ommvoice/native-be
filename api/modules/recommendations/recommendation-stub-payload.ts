import { opportunityEventThemeLabel } from "../opportunity/common/constants/opportunity-theme.js";
import { opportunityEventTypeLabel } from "../opportunity/common/constants/opportunity-types.js";
import type { OpportunityClubResponse } from "../opportunity/clubs/types.js";
import type { OpportunityEventResponse } from "../opportunity/events/types.js";
import type { OpportunityRouteResponse } from "../opportunity/routes/types.js";
import type { OpportunityVenueResponse } from "../opportunity/venues/types.js";
import type { RecommendationCandidate, RecommendationOpportunityPayload } from "./types.js";

const epoch = new Date(0);

/** Minimal getById-shaped payloads for unit tests (repository stub). */
export function stubOpportunityPayloadFromCandidate(
  c: RecommendationCandidate,
): RecommendationOpportunityPayload {
  const theme = { slug: c.themeSlug, label: opportunityEventThemeLabel(c.themeSlug) };

  if (c.type === "venue") {
    const row: OpportunityVenueResponse = {
      id: c.id,
      name: c.name,
      type: "venue",
      description: c.description,
      venuePostCode: c.postcode,
      openingDaysAndTimes: null,
      openingExclusions: null,
      interestTags: c.interestTags,
      estimatedTimeToSpend: null,
      createdAt: epoch,
      updatedAt: epoch,
      adultCost: null,
      childCost: null,
      infantCost: null,
      theme,
      generalFacilities: [],
      kidsFacilities: [],
      parentFacilities: [],
      dogFacilities: [],
      ageSuitabilities: c.ageSuitabilitySlugs.map((slug) => ({ slug, label: slug })),
      extraKits: [],
      seasonalHighlights: [],
      highlightAttractions: [],
    };
    return row;
  }

  if (c.type === "event") {
    const eventTypeSlug = "family_fun_day";
    const row: OpportunityEventResponse = {
      id: c.id,
      name: c.name,
      type: "event",
      description: c.description,
      startDate: null,
      endDate: null,
      startTime: null,
      finishTime: null,
      venuePostCode: c.postcode,
      interestTags: c.interestTags,
      skillAreaVariant: null,
      createdAt: epoch,
      updatedAt: epoch,
      adultCost: null,
      childCost: null,
      infantCost: null,
      theme,
      eventType: { slug: eventTypeSlug, label: opportunityEventTypeLabel(eventTypeSlug) },
      generalFacilities: [],
      kidsFacilities: [],
      parentFacilities: [],
      ageSuitabilities: c.ageSuitabilitySlugs.map((slug) => ({ slug, label: slug })),
      extraKits: [],
      seasonalHighlights: [],
      highlightAttractions: [],
    };
    return row;
  }

  if (c.type === "club") {
    const row: OpportunityClubResponse = {
      id: c.id,
      name: c.name,
      type: "club",
      description: c.description,
      venuePostCode: c.postcode,
      startTime: null,
      finishTime: null,
      interestTags: c.interestTags,
      skillAreaVariant: null,
      createdAt: epoch,
      updatedAt: epoch,
      adultCost: null,
      childCost: null,
      infantCost: null,
      theme,
      generalFacilities: [],
      kidsFacilities: [],
      parentFacilities: [],
      ageSuitabilities: c.ageSuitabilitySlugs.map((slug) => ({ slug, label: slug })),
      extraKits: [],
      seasonalHighlights: [],
      highlightAttractions: [],
    };
    return row;
  }

  const row: OpportunityRouteResponse = {
    id: c.id,
    name: c.name,
    type: "route",
    description: c.description,
    routeDistanceMiles: null,
    startPointPostCode: c.postcode,
    interestTags: c.interestTags,
    createdAt: epoch,
    updatedAt: epoch,
    adultCost: null,
    childCost: null,
    infantCost: null,
    theme,
    routeSuitabilities: [],
    terrainTypes: [],
    generalFacilities: [],
    kidsFacilities: [],
    parentFacilities: [],
    dogFacilities: [],
    extraKits: [],
    seasonalHighlights: [],
    highlightAttractions: [],
  };
  return row;
}
