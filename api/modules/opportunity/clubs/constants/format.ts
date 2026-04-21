/** Seeded in `prisma/seed.ts` → `opportunity_club_formats`. */
export const OPPORTUNITY_CLUB_FORMAT_LABELS = {
  stay_and_play_supervised: "Stay-and-play (supervised)",
  lesson: "Lesson",
} as const;

export type OpportunityClubFormatSlug = keyof typeof OPPORTUNITY_CLUB_FORMAT_LABELS;

export const OPPORTUNITY_CLUB_FORMAT_SLUGS = Object.keys(
  OPPORTUNITY_CLUB_FORMAT_LABELS,
) as OpportunityClubFormatSlug[];

export function opportunityClubFormatLabel(slug: string): string {
  return (
    OPPORTUNITY_CLUB_FORMAT_LABELS[slug as OpportunityClubFormatSlug] ?? slug
  );
}
