/**
 * Kids facilities on **OpportunityEvent**: API sends slugs; Prisma stores M2M to `opportunity_kids_facilities`.
 * Venues, clubs, and routes still use `opportunity_kids_facilities` with join tables.
 */
export const OPPORTUNITY_EVENT_KIDS_FACILITY_LABELS = {
  activity_sheets: "Activity sheets",
  activity_trail: "Activity trail",
  childrens_trail: "Children's trail",
  clues_games: "Clues / games",
  colouring: "Colouring",
  ice_creams: "Ice creams",
  indoor_games: "Indoor games (puzzles, boards)",
  play_equipment: "Play equipment",
  treasure_hunt: "Treasure hunt",
} as const;

export type OpportunityEventKidsFacilitySlug =
  keyof typeof OPPORTUNITY_EVENT_KIDS_FACILITY_LABELS;

export const OPPORTUNITY_EVENT_KIDS_FACILITY_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_KIDS_FACILITY_LABELS,
) as OpportunityEventKidsFacilitySlug[];

export function opportunityEventKidsFacilityLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_KIDS_FACILITY_LABELS[
      slug as OpportunityEventKidsFacilitySlug
    ] ?? slug
  );
}
