export interface TerrainTypeEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const TERRAIN_TYPE_ENUM: TerrainTypeEntry[] = [
  { name: "Steep", slug: "steep", active: true },
  { name: "Undulating", slug: "undulating", active: true },
  { name: "Flat", slug: "flat", active: true },
  { name: "Mixed terrain", slug: "mixed", active: true },
  { name: "Steps", slug: "steps", active: true },
  { name: "Rocky", slug: "rocky", active: true },
  { name: "Gravel", slug: "gravel", active: true },
  { name: "Uneven", slug: "uneven", active: true },
  { name: "Surfaced / smooth", slug: "surfaced_smooth", active: true },
  { name: "Sand", slug: "sand", active: true },
  { name: "Woodland track", slug: "woodland_track", active: true },
];

export type TerrainTypeSlug = (typeof TERRAIN_TYPE_ENUM)[number]["slug"];
