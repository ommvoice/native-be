import type { OpportunityClubV2 } from "../../types/opportunity-v2.types.js";

/**
 * Shape of a single item in app/shared/assets/clubs.json.
 * Same fields as OpportunityClubV2 minus the DB-only ones (id/createdAt/updatedAt)
 * and the nested theme refs (flat slugs instead). Date fields are ISO strings
 * here, not Date instances — JSON.stringify already serialized them that way.
 */
export type Club = Omit<
  OpportunityClubV2,
  "id" | "theme" | "themeVariant" | "createdAt" | "updatedAt" | "clubStartDate" | "clubEndDate"
> & {
  themeSlug: string;
  themeVariantSlug: string;
  clubStartDate: string | null;
  clubEndDate: string | null;
};
