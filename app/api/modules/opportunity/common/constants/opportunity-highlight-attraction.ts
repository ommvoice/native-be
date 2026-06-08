/**
 * Highlight attractions on **OpportunityEvent**: API sends slugs; Prisma stores M2M to `opportunity_highlight_attractions`.
 * Venues, clubs, and routes still use `opportunity_highlight_attractions` with join tables.
 */
export const OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_LABELS = {
  animal_displays_or_shows: "Animal displays or shows",
  animal_feeding: "Animal feeding",
  animal_races: "Animal races",
  challenges_or_missions: "Challenges or missions",
  forest_school_activities: "Forest school activities",
  hands_on_activities: "Hands-on activities",
  hands_on_petting: "Hands-on Petting",
  immersive_natural_surroundings: "Immersive natural surroundings",
  keeper_talks: "Keeper talks",
  large_interactive_exhibits: "Large interactive exhibits",
  live_shows_or_performances: "Live shows or performances",
  meet_and_greet_characters: "Meet & greet characters or people",
  mud_kitchens: "Mud kitchens",
  quiet_or_low_intervention_spaces: "Quiet or low-intervention spaces",
  rides_and_attractions: "Rides & attractions",
  tractor_rides: "Tractor rides",
} as const;

export type OpportunityEventHighlightAttractionSlug =
  keyof typeof OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_LABELS;

export const OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_LABELS,
) as OpportunityEventHighlightAttractionSlug[];

export function opportunityEventHighlightAttractionLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_HIGHLIGHT_ATTRACTION_LABELS[
      slug as OpportunityEventHighlightAttractionSlug
    ] ?? slug
  );
}
