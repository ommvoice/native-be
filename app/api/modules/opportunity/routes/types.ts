import type { OpportunityRoute } from "../../../types/db.js";

type OpportunityRouteSlugListFields = {
  routeSuitabilitySlugs?: string[] | null;
  terrainTypeSlugs?: string[] | null;
  generalFacilitySlugs?: string[] | null;
  kidsFacilitySlugs?: string[] | null;
  parentFacilitySlugs?: string[] | null;
  dogFacilitySlugs?: string[] | null;
  extraKitSlugs?: string[] | null;
  seasonalHighlightSlugs?: string[] | null;
  highlightAttractionSlugs?: string[] | null;
};

export type EnrichableOpportunityRoute = OpportunityRoute &
  OpportunityRouteSlugListFields;

export interface OpportunitySlugLabel {
  slug: string;
  label: string;
}

/** API shape: no raw *Slug / *Slugs columns; costs and distance are numbers, not Prisma Decimal. */
export interface OpportunityRouteResponse {
  id: string;
  name: string;
  type: string;
  description: string | null;
  routeDistanceMiles: number | null;
  startPointPostCode: string | null;
  interestTags: string | null;
  createdAt: Date;
  updatedAt: Date;
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  theme: OpportunitySlugLabel;
  themeVariant?: OpportunitySlugLabel | undefined;
  routeType?: OpportunitySlugLabel | undefined;
  difficultyRating?: OpportunitySlugLabel | undefined;
  activityGroup?: OpportunitySlugLabel | undefined;
  parkingProvision?: OpportunitySlugLabel | undefined;
  venueSetting?: OpportunitySlugLabel | undefined;
  seasonalTag?: OpportunitySlugLabel | undefined;
  routeSuitabilities: OpportunitySlugLabel[];
  terrainTypes: OpportunitySlugLabel[];
  generalFacilities: OpportunitySlugLabel[];
  kidsFacilities: OpportunitySlugLabel[];
  parentFacilities: OpportunitySlugLabel[];
  dogFacilities: OpportunitySlugLabel[];
  extraKits: OpportunitySlugLabel[];
  seasonalHighlights: OpportunitySlugLabel[];
  highlightAttractions: OpportunitySlugLabel[];
}
