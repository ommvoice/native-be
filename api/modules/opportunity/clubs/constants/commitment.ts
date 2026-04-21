/** Seeded in `prisma/seed.ts` → `opportunity_commitments`. */
export const OPPORTUNITY_CLUB_COMMITMENT_LABELS = {
  monthly: "Monthly",
  annually: "Annually",
  termly_blocks: "Termly Blocks",
} as const;

export type OpportunityClubCommitmentSlug =
  keyof typeof OPPORTUNITY_CLUB_COMMITMENT_LABELS;

export const OPPORTUNITY_CLUB_COMMITMENT_SLUGS = Object.keys(
  OPPORTUNITY_CLUB_COMMITMENT_LABELS,
) as OpportunityClubCommitmentSlug[];

export function opportunityClubCommitmentLabel(slug: string): string {
  return (
    OPPORTUNITY_CLUB_COMMITMENT_LABELS[
      slug as OpportunityClubCommitmentSlug
    ] ?? slug
  );
}
