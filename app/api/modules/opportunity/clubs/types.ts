import type { OpportunityClub } from "../../../types/db.js";

type OpportunityClubSlugListFields = {
  generalFacilitySlugs?: string[] | null;
  kidsFacilitySlugs?: string[] | null;
  parentFacilitySlugs?: string[] | null;
  ageSuitabilitySlugs?: string[] | null;
  extraKitSlugs?: string[] | null;
  seasonalHighlightSlugs?: string[] | null;
  highlightAttractionSlugs?: string[] | null;
};

export type EnrichableOpportunityClub = OpportunityClub &
  OpportunityClubSlugListFields;

export interface OpportunitySlugLabel {
  slug: string;
  label: string;
}

/** API shape: no raw *Slug / *Slugs columns; costs are numbers, not Prisma Decimal. */
export interface OpportunityClubResponse {
  id: string;
  name: string;
  type: string;
  description: string | null;
  venuePostCode: string | null;
  startTime: string | null;
  finishTime: string | null;
  interestTags: string | null;
  skillAreaVariant: string | null;
  createdAt: Date;
  updatedAt: Date;
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  theme: OpportunitySlugLabel;
  themeVariant?: OpportunitySlugLabel | undefined;
  dayOfWeek?: OpportunitySlugLabel | undefined;
  activityGroup?: OpportunitySlugLabel | undefined;
  clubFormat?: OpportunitySlugLabel | undefined;
  clubFrequency?: OpportunitySlugLabel | undefined;
  commitment?: OpportunitySlugLabel | undefined;
  skillArea?: OpportunitySlugLabel | undefined;
  abilityLevel?: OpportunitySlugLabel | undefined;
  parkingProvision?: OpportunitySlugLabel | undefined;
  venueSetting?: OpportunitySlugLabel | undefined;
  seasonalTag?: OpportunitySlugLabel | undefined;
  generalFacilities: OpportunitySlugLabel[];
  kidsFacilities: OpportunitySlugLabel[];
  parentFacilities: OpportunitySlugLabel[];
  ageSuitabilities: OpportunitySlugLabel[];
  extraKits: OpportunitySlugLabel[];
  seasonalHighlights: OpportunitySlugLabel[];
  highlightAttractions: OpportunitySlugLabel[];
}
