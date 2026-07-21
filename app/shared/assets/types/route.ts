import type { OpportunityRouteV2 } from "../../types/opportunity-v2.types.js";

/**
 * Shape of a single item in app/shared/assets/routes.json.
 * Same fields as OpportunityRouteV2 minus the DB-only ones (id/createdAt/updatedAt)
 * and the nested theme refs, which the seed/export data carries as flat slugs instead.
 */
export type Route = Omit<OpportunityRouteV2, "id" | "theme" | "themeVariant" | "createdAt" | "updatedAt"> & {
  themeSlug: string;
  themeVariantSlug: string;
};
