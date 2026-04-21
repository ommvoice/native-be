/** Seeded in `prisma/seed.ts` → `opportunity_route_types`. */
export const OPPORTUNITY_ROUTE_TYPE_LABELS = {
  circular: "Circular",
  straight: "Straight",
} as const;

export type OpportunityRouteTypeSlug = keyof typeof OPPORTUNITY_ROUTE_TYPE_LABELS;

export const OPPORTUNITY_ROUTE_TYPE_SLUGS = Object.keys(
  OPPORTUNITY_ROUTE_TYPE_LABELS,
) as OpportunityRouteTypeSlug[];

export function opportunityRouteTypeLabel(slug: string): string {
  return OPPORTUNITY_ROUTE_TYPE_LABELS[slug as OpportunityRouteTypeSlug] ?? slug;
}
