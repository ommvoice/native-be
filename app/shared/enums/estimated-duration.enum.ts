export interface EstimatedDurationEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const ESTIMATED_DURATION_ENUM: EstimatedDurationEntry[] = [
  { name: "Under 30mins", slug: "under_thirty_mins", active: true },
  { name: "30-60mins", slug: "thirty_sixty_mins", active: true },
  { name: "1-2hrs", slug: "one_two_hours", active: true },
  { name: "2-3hrs", slug: "two_three_hours", active: true },
  { name: "4+ hours", slug: "four_plus", active: true },
  { name: "Whole Day", slug: "whole_day", active: true },
];

export type EstimatedDurationSlug = (typeof ESTIMATED_DURATION_ENUM)[number]["slug"];
