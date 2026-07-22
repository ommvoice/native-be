import type { OpportunityRecordType } from "../../config/index.js";

export type OpportunityClubV2SeedInput = {
  opportunityType?: OpportunityRecordType;
  themeSlug: string;
  themeVariantSlug: string;
  clubName: string;
  [key: string]: unknown;
};
