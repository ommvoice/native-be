import type { OpportunityRecordType } from "../../config/index.js";

export type OpportunityEventV2SeedInput = {
  opportunityType?: OpportunityRecordType;
  themeSlug: string;
  themeVariantSlug: string;
  eventName: string;
  [key: string]: unknown;
};
