/** Seeded in `prisma/seed.ts` → `opportunity_club_frequencies`. */
export const OPPORTUNITY_CLUB_FREQUENCY_LABELS = {
  weekly: "Weekly",
} as const;

export type OpportunityClubFrequencySlug =
  keyof typeof OPPORTUNITY_CLUB_FREQUENCY_LABELS;

export const OPPORTUNITY_CLUB_FREQUENCY_SLUGS = Object.keys(
  OPPORTUNITY_CLUB_FREQUENCY_LABELS,
) as OpportunityClubFrequencySlug[];

export function opportunityClubFrequencyLabel(slug: string): string {
  return (
    OPPORTUNITY_CLUB_FREQUENCY_LABELS[
      slug as OpportunityClubFrequencySlug
    ] ?? slug
  );
}
