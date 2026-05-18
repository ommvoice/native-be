import type { OpportunityVenue } from "../../../types/db.js";

/** Plain DB row; facility values are slug arrays, labels resolved in helpers. */
export type EnrichableOpportunityVenue = OpportunityVenue;

export interface OpportunitySlugLabel {
  slug: string;
  label: string;
}

/** API shape: no raw *Slug columns; costs are numbers, not Prisma Decimal; venuePostCode not venuePostcode. */
export interface OpportunityVenueResponse {
  id: string;
  name: string;
  type: string;
  description: string | null;
  venuePostCode: string | null;
  openingDaysAndTimes: string | null;
  openingExclusions: string | null;
  interestTags: string | null;
  estimatedTimeToSpend: string | null;
  createdAt: Date;
  updatedAt: Date;
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  theme: OpportunitySlugLabel;
  themeVariant?: OpportunitySlugLabel | undefined;
  activityGroup?: OpportunitySlugLabel | undefined;
  terrainType?: OpportunitySlugLabel | undefined;
  parkingProvision?: OpportunitySlugLabel | undefined;
  venueSetting?: OpportunitySlugLabel | undefined;
  seasonalTag?: OpportunitySlugLabel | undefined;
  generalFacilities: OpportunitySlugLabel[];
  kidsFacilities: OpportunitySlugLabel[];
  parentFacilities: OpportunitySlugLabel[];
  dogFacilities: OpportunitySlugLabel[];
  ageSuitabilities: OpportunitySlugLabel[];
  extraKits: OpportunitySlugLabel[];
  seasonalHighlights: OpportunitySlugLabel[];
  highlightAttractions: OpportunitySlugLabel[];
}
