/**
 * Opportunity event types: stored as `eventTypeSlug` on `OpportunityEvent` (no DB lookup table).
 * Add new values here and run a migration only if you need DB-level checks (optional).
 */
export const OPPORTUNITY_EVENT_TYPE_LABELS = {
  country_show: "Agricultural or County Show",
  crafty_making: "Crafty making",
  entertainment: "Entertainment",
  family_fun_day: "Family fun day",
  festival: "Festival",
  festive: "Festive",
  formal_event: "Formal event",
  music: "Music",
  nature_based: "Celebrate Nature",
  performance: "Performance",
  shared_meal: "Shared meal",
  social_gathering: "Social gathering",
  sport_based: "Sporting event",
  workshop_or_talk: "Workshop or talk",
} as const;

export type OpportunityEventTypeSlug =
  keyof typeof OPPORTUNITY_EVENT_TYPE_LABELS;

export const OPPORTUNITY_EVENT_TYPE_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_TYPE_LABELS,
) as OpportunityEventTypeSlug[];

export function opportunityEventTypeLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_TYPE_LABELS[slug as OpportunityEventTypeSlug] ?? slug
  );
}
