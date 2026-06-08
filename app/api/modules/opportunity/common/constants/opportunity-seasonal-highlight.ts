/**
 * Seasonal highlights on **OpportunityEvent**: API sends slugs; Prisma stores M2M to `opportunity_seasonal_highlights`.
 * Venues, clubs, and routes still use `opportunity_seasonal_highlights` with join tables.
 */
export const OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_LABELS = {
  autumn_colours: "Autumn colours",
  autumn_leaves: "Autumn Leaves",
  autumn_pony_drifts: 'Autumn pony "drifts"',
  baby_lambs: "Baby Lambs",
  birdsong: "Birdsong",
  bluebells: "Bluebells",
} as const;

export type OpportunityEventSeasonalHighlightSlug =
  keyof typeof OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_LABELS;

export const OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_LABELS,
) as OpportunityEventSeasonalHighlightSlug[];

export function opportunityEventSeasonalHighlightLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_SEASONAL_HIGHLIGHT_LABELS[
      slug as OpportunityEventSeasonalHighlightSlug
    ] ?? slug
  );
}
