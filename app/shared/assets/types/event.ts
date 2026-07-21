import type { OpportunityEventV2 } from "../../types/opportunity-v2.types.js";

/**
 * Shape of a single item in app/shared/assets/events.json.
 * Same fields as OpportunityEventV2 minus the DB-only ones (id/createdAt/updatedAt)
 * and the nested theme refs (flat slugs instead). Date fields are ISO strings
 * here, not Date instances — JSON.stringify already serialized them that way.
 */
export type Event = Omit<
  OpportunityEventV2,
  | "id"
  | "theme"
  | "themeVariant"
  | "createdAt"
  | "updatedAt"
  | "eventStartDate"
  | "eventEndDate"
  | "ticketSalesStartDate"
> & {
  themeSlug: string;
  themeVariantSlug: string;
  eventStartDate: string | null;
  eventEndDate: string | null;
  ticketSalesStartDate: string | null;
};
