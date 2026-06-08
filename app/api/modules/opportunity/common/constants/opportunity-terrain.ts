/** Seeded in `prisma/seed.ts` → `opportunity_terrain_types`. Venues use FK; routes use slug arrays + these labels. */
export const OPPORTUNITY_TERRAIN_LABELS = {
  flat: "Flat",
  steep: "Steep",
  undulating: "Undulating",
  rocky: "Rocky",
  uneven: "Uneven",
} as const;

export type OpportunityTerrainSlug = keyof typeof OPPORTUNITY_TERRAIN_LABELS;

export const OPPORTUNITY_TERRAIN_SLUGS = Object.keys(
  OPPORTUNITY_TERRAIN_LABELS,
) as OpportunityTerrainSlug[];

export function opportunityTerrainLabel(slug: string): string {
  return OPPORTUNITY_TERRAIN_LABELS[slug as OpportunityTerrainSlug] ?? slug;
}
