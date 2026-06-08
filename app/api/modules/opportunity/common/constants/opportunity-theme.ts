/**
 * Opportunity themes allowed on **OpportunityEvent** only: stored as `themeSlug` (no FK to `opportunity_themes`).
 * Venues, clubs, and routes still use the `opportunity_themes` lookup table.
 */
export const OPPORTUNITY_EVENT_THEME_LABELS = {
  a_big_day_out: "A Big Day Out",
  animal_encounters: "Animal Encounters",
  green_spaces_to_run_around: "Green Spaces to Run Around",
  nature_and_wildlife_exploration: "Nature & Wildlife Exploration",
  scenic_walks_and_wanders: "Scenic Walks & Wanders",
  scenic_walks_and_wonders: "Scenic Walks & Wonders",
} as const;

export type OpportunityEventThemeSlug =
  keyof typeof OPPORTUNITY_EVENT_THEME_LABELS;

export const OPPORTUNITY_EVENT_THEME_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_THEME_LABELS,
) as OpportunityEventThemeSlug[];

export function opportunityEventThemeLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_THEME_LABELS[slug as OpportunityEventThemeSlug] ?? slug
  );
}
