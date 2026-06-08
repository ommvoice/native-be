/**
 * Seasonal tags allowed on **OpportunityEvent** only: stored as optional `seasonalTagSlug` (no FK).
 * Venues, clubs, and routes still use `opportunity_seasonal_tags`.
 */
export const OPPORTUNITY_EVENT_SEASONAL_TAG_LABELS = {
  autumn: "Autumn colours",
  easter: "Easter",
  summer: "Summer",
  winter: "Winter",
} as const;

export type OpportunityEventSeasonalTagSlug =
  keyof typeof OPPORTUNITY_EVENT_SEASONAL_TAG_LABELS;

export const OPPORTUNITY_EVENT_SEASONAL_TAG_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_SEASONAL_TAG_LABELS,
) as OpportunityEventSeasonalTagSlug[];

export function opportunityEventSeasonalTagLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_SEASONAL_TAG_LABELS[
      slug as OpportunityEventSeasonalTagSlug
    ] ?? slug
  );
}
