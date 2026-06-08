/** Seeded in `prisma/seed.ts` → `opportunity_difficulty_ratings`. */
export const OPPORTUNITY_ROUTE_DIFFICULTY_LABELS = {
  easy: "Easy",
  mountain: "Mountain",
  challenging: "Challenging",
} as const;

export type OpportunityRouteDifficultySlug =
  keyof typeof OPPORTUNITY_ROUTE_DIFFICULTY_LABELS;

export const OPPORTUNITY_ROUTE_DIFFICULTY_SLUGS = Object.keys(
  OPPORTUNITY_ROUTE_DIFFICULTY_LABELS,
) as OpportunityRouteDifficultySlug[];

export function opportunityRouteDifficultyLabel(slug: string): string {
  return (
    OPPORTUNITY_ROUTE_DIFFICULTY_LABELS[
      slug as OpportunityRouteDifficultySlug
    ] ?? slug
  );
}
