/**
 * Ability levels allowed on **OpportunityEvent** only: stored as optional `abilityLevelSlug` (no FK).
 * Clubs still use `opportunity_ability_levels`.
 */
export const OPPORTUNITY_EVENT_ABILITY_LEVEL_LABELS = {
  novice: "Novice",
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
} as const;

export type OpportunityEventAbilityLevelSlug =
  keyof typeof OPPORTUNITY_EVENT_ABILITY_LEVEL_LABELS;

export const OPPORTUNITY_EVENT_ABILITY_LEVEL_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_ABILITY_LEVEL_LABELS,
) as OpportunityEventAbilityLevelSlug[];

export function opportunityEventAbilityLevelLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_ABILITY_LEVEL_LABELS[
      slug as OpportunityEventAbilityLevelSlug
    ] ?? slug
  );
}
