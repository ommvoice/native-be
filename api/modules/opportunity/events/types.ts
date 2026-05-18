import type { OpportunityEvent } from "../../../types/db.js";

type OpportunityEventSlugListFields = {
  generalFacilitySlugs?: string[] | null;
  kidsFacilitySlugs?: string[] | null;
  parentFacilitySlugs?: string[] | null;
  ageSuitabilitySlugs?: string[] | null;
  extraKitSlugs?: string[] | null;
  seasonalHighlightSlugs?: string[] | null;
  highlightAttractionSlugs?: string[] | null;
};

export type EnrichableOpportunityEvent = OpportunityEvent &
  OpportunityEventSlugListFields;

  
interface OpportunitySlugLabel {
  slug: string;
  label: string;
}

/** API shape: no raw *Slug / *Slugs columns; costs are numbers, not Prisma Decimal. */
export interface OpportunityEventResponse {
  id: string;
  name: string;
  type: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  finishTime: string | null;
  venuePostCode: string | null;
  interestTags: string | null;
  skillAreaVariant: string | null;
  createdAt: Date;
  updatedAt: Date;
  adultCost: number | null;
  childCost: number | null;
  infantCost: number | null;
  theme: OpportunitySlugLabel;
  themeVariant?: OpportunitySlugLabel | undefined;
  eventType: OpportunitySlugLabel;
  activityGroup?: OpportunitySlugLabel | undefined;
  parkingProvision?: OpportunitySlugLabel | undefined;
  venueSetting?: OpportunitySlugLabel | undefined;
  skillArea?: OpportunitySlugLabel | undefined;
  abilityLevel?: OpportunitySlugLabel | undefined;
  seasonalTag?: OpportunitySlugLabel | undefined;
  generalFacilities: OpportunitySlugLabel[];
  kidsFacilities: OpportunitySlugLabel[];
  parentFacilities: OpportunitySlugLabel[];
  ageSuitabilities: OpportunitySlugLabel[];
  extraKits: OpportunitySlugLabel[];
  seasonalHighlights: OpportunitySlugLabel[];
  highlightAttractions: OpportunitySlugLabel[];
}
