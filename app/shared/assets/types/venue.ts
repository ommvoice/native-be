import type { OpportunityVenueV2 } from "../../types/opportunity-v2.types.js";

/**
 * Shape of a single item in app/shared/assets/venues.json.
 * Same fields as OpportunityVenueV2 minus the DB-only ones (id/createdAt/updatedAt),
 * minus opportunityType (hardcoded to "venue" at seed-insert time, not present in
 * the venue seed data itself), and the nested theme refs, which the seed/export
 * data carries as flat slugs instead.
 */
export type Venue = Omit<OpportunityVenueV2, "id" | "opportunityType" | "theme" | "themeVariant" | "createdAt" | "updatedAt"> & {
  themeSlug: string;
  themeVariantSlug: string;
};
