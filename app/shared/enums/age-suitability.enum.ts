export interface AgeSuitabilityEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const AGE_SUITABILITY_ENUM: AgeSuitabilityEntry[] = [
  { name: "Under 1's", slug: "under_one", active: true },
  { name: "1", slug: "1_years", active: true },
  { name: "2", slug: "2_years", active: true },
  { name: "3", slug: "3_years", active: true },
  { name: "4", slug: "4_years", active: true },
  { name: "5", slug: "5_years", active: true },
  { name: "6", slug: "6_years", active: true },
  { name: "7", slug: "7_years", active: true },
  { name: "8", slug: "8_years", active: true },
  { name: "9", slug: "9_years", active: true },
  { name: "10", slug: "10_years", active: true },
  { name: "11", slug: "11_years", active: true },
  { name: "12", slug: "12_years", active: true },
  { name: "13+", slug: "13_years", active: true },
  { name: "16+", slug: "16_years", active: true },
];

export type AgeSuitabilitySlug = (typeof AGE_SUITABILITY_ENUM)[number]["slug"];
