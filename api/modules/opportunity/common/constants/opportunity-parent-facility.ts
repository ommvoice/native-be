/**
 * Parent facilities on **OpportunityEvent**: API sends slugs; Prisma stores M2M to `opportunity_parent_facilities`.
 * Venues, clubs, and routes still use `opportunity_parent_facilities` with join tables.
 */
export const OPPORTUNITY_EVENT_PARENT_FACILITY_LABELS = {
  clear_sightlines: "Clear Sightlines",
  comfy_seating: "Comfy Seating / Sofas",
  drinks_stand: "Drinks stand",
  hot_cold_food: "Hot & Cold food",
  hot_drinks: "Hot Drinks",
  log_burner: "Log burner",
  outdoor_terrace: "Outdoor terrace",
  snacks: "Snacks",
  sunloungers: "Sunloungers",
  sweet_treats: "Sweet treats",
  wifi: "WiFi",
} as const;

export type OpportunityEventParentFacilitySlug =
  keyof typeof OPPORTUNITY_EVENT_PARENT_FACILITY_LABELS;

export const OPPORTUNITY_EVENT_PARENT_FACILITY_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_PARENT_FACILITY_LABELS,
) as OpportunityEventParentFacilitySlug[];

export function opportunityEventParentFacilityLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_PARENT_FACILITY_LABELS[
      slug as OpportunityEventParentFacilitySlug
    ] ?? slug
  );
}
