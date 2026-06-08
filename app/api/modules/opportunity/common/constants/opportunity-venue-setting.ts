/**
 * Venue settings allowed on **OpportunityEvent** only: stored as optional `venueSettingSlug` (no FK).
 * Venues, clubs, and routes still use `opportunity_venue_settings`.
 */
export const OPPORTUNITY_EVENT_VENUE_SETTING_LABELS = {
  inside: "Inside",
  outside: "Outside",
} as const;

export type OpportunityEventVenueSettingSlug =
  keyof typeof OPPORTUNITY_EVENT_VENUE_SETTING_LABELS;

export const OPPORTUNITY_EVENT_VENUE_SETTING_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_VENUE_SETTING_LABELS,
) as OpportunityEventVenueSettingSlug[];

export function opportunityEventVenueSettingLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_VENUE_SETTING_LABELS[
      slug as OpportunityEventVenueSettingSlug
    ] ?? slug
  );
}
