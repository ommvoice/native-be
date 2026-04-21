/** Seeded in `prisma/seed.ts` → `opportunity_days_of_week`. */
export const OPPORTUNITY_CLUB_DAY_OF_WEEK_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
} as const;

export type OpportunityClubDayOfWeekSlug =
  keyof typeof OPPORTUNITY_CLUB_DAY_OF_WEEK_LABELS;

export const OPPORTUNITY_CLUB_DAY_OF_WEEK_SLUGS = Object.keys(
  OPPORTUNITY_CLUB_DAY_OF_WEEK_LABELS,
) as OpportunityClubDayOfWeekSlug[];

export function opportunityClubDayOfWeekLabel(slug: string): string {
  return (
    OPPORTUNITY_CLUB_DAY_OF_WEEK_LABELS[
      slug as OpportunityClubDayOfWeekSlug
    ] ?? slug
  );
}
