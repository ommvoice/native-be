/** Aligned with `facilities` table (DOG type). */
export const OPPORTUNITY_ROUTE_DOG_FACILITY_LABELS = {
  dog_bins: "Poo Bins",
  dog_wash: "Dog Wash",
  lead_only: "Dogs On Leads",
} as const;

export type OpportunityRouteDogFacilitySlug =
  keyof typeof OPPORTUNITY_ROUTE_DOG_FACILITY_LABELS;

export const OPPORTUNITY_ROUTE_DOG_FACILITY_SLUGS = Object.keys(
  OPPORTUNITY_ROUTE_DOG_FACILITY_LABELS,
) as OpportunityRouteDogFacilitySlug[];

export function opportunityRouteDogFacilityLabel(slug: string): string {
  return (
    OPPORTUNITY_ROUTE_DOG_FACILITY_LABELS[
      slug as OpportunityRouteDogFacilitySlug
    ] ?? slug
  );
}
