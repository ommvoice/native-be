export interface ClubFrequencyEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const CLUB_FREQUENCY_ENUM: ClubFrequencyEntry[] = [
  { name: "One-off", slug: "one_off", active: true },
  { name: "Daily", slug: "daily", active: true },
  { name: "Weekly", slug: "weekly", active: true },
  { name: "Monthly", slug: "monthly", active: true },
  { name: "Term-time only", slug: "term_time_only", active: true },
  { name: "All year (with exceptions)", slug: "all_year_with_exceptions", active: true },
];

export type ClubFrequencySlug = (typeof CLUB_FREQUENCY_ENUM)[number]["slug"];
