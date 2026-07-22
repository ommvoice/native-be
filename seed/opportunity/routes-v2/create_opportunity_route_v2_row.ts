import type { OpportunityRecordType } from "../../config/index.js";

export type OpportunityRouteV2SeedInput = {
  opportunityType?: OpportunityRecordType;
  themeSlug: string;
  themeVariantSlug: string;
  routeName: string;
  [key: string]: unknown;
};
