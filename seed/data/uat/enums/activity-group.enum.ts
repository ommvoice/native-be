export interface ActivityGroupEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const ACTIVITY_GROUP_ENUM: ActivityGroupEntry[] = [
  { name: "Simple Reset", slug: "simple_reset", active: true },
  { name: "Energy Burner", slug: "energy_burner", active: true },
  { name: "Low Effort", slug: "low_effort", active: true },
  { name: "Special Day Out", slug: "special_day_out", active: true },
  { name: "Moment of Peace", slug: "moment_of_peace", active: true },
  { name: "Wilder Adventure", slug: "wilder_adventure", active: true },
  { name: "Under the Radar", slug: "under_the_radar", active: true },
];

export type ActivityGroupSlug = (typeof ACTIVITY_GROUP_ENUM)[number]["slug"];
