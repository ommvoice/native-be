/**
 * Theme variants allowed on **OpportunityEvent** only: stored as `themeVariantSlug` (no FK).
 * Venues, clubs, and routes still use `opportunity_theme_variants`.
 */
export const OPPORTUNITY_EVENT_THEME_VARIANT_LABELS = {
  amusement_park: "Amusement Park",
  animal_parks_and_zoos: "Animal Parks & Zoos",
  forest_school: "Forest School",
  seasonal_and_themed_events: "Seasonal & Themed Events",
  woodland_and_forest_walks: "Woodland & Forest Walks",
} as const;

export type OpportunityEventThemeVariantSlug =
  keyof typeof OPPORTUNITY_EVENT_THEME_VARIANT_LABELS;

export const OPPORTUNITY_EVENT_THEME_VARIANT_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_THEME_VARIANT_LABELS,
) as OpportunityEventThemeVariantSlug[];

export function opportunityEventThemeVariantLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_THEME_VARIANT_LABELS[
      slug as OpportunityEventThemeVariantSlug
    ] ?? slug
  );
}
