/**
 * Skill areas allowed on **OpportunityEvent** only: stored as optional `skillAreaSlug` (no FK).
 * Clubs still use `opportunity_skill_areas`.
 */
export const OPPORTUNITY_EVENT_SKILL_AREA_LABELS = {
  creative_arts: "Creative Arts",
  outdoors_and_nature: "Outdoors & Nature",
  sports: "Sports",
} as const;

export type OpportunityEventSkillAreaSlug =
  keyof typeof OPPORTUNITY_EVENT_SKILL_AREA_LABELS;

export const OPPORTUNITY_EVENT_SKILL_AREA_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_SKILL_AREA_LABELS,
) as OpportunityEventSkillAreaSlug[];

export function opportunityEventSkillAreaLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_SKILL_AREA_LABELS[
      slug as OpportunityEventSkillAreaSlug
    ] ?? slug
  );
}
