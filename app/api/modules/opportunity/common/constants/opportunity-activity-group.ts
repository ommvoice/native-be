/**
 * Activity groups allowed on **OpportunityEvent** only: stored as `activityGroupSlug` (no FK).
 * Venues, clubs, and routes still use `opportunity_activity_groups`.
 */
export const OPPORTUNITY_EVENT_ACTIVITY_GROUP_LABELS = {
  energy_burner: "Energy Burner",
  low_effort: "Low Effort",
  special_day_out: "Special Day Out",
} as const;

export type OpportunityEventActivityGroupSlug =
  keyof typeof OPPORTUNITY_EVENT_ACTIVITY_GROUP_LABELS;

export const OPPORTUNITY_EVENT_ACTIVITY_GROUP_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_ACTIVITY_GROUP_LABELS,
) as OpportunityEventActivityGroupSlug[];

export function opportunityEventActivityGroupLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_ACTIVITY_GROUP_LABELS[
      slug as OpportunityEventActivityGroupSlug
    ] ?? slug
  );
}
