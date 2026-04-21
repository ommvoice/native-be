/** Seeded in `prisma/seed.ts` → `opportunity_route_suitabilities`. */
export const OPPORTUNITY_ROUTE_SUITABILITY_LABELS = {
  buggy: "Buggy",
  bikes: "Bikes",
  mountain_bikes: "Mountain Bikes",
  carriers: "Carriers",
  xc_buggies: "XC Buggies",
} as const;

export type OpportunityRouteSuitabilitySlug =
  keyof typeof OPPORTUNITY_ROUTE_SUITABILITY_LABELS;

export const OPPORTUNITY_ROUTE_SUITABILITY_SLUGS = Object.keys(
  OPPORTUNITY_ROUTE_SUITABILITY_LABELS,
) as OpportunityRouteSuitabilitySlug[];

export function opportunityRouteSuitabilityLabel(slug: string): string {
  return (
    OPPORTUNITY_ROUTE_SUITABILITY_LABELS[
      slug as OpportunityRouteSuitabilitySlug
    ] ?? slug
  );
}
