export interface RouteTypeEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const ROUTE_TYPE_ENUM: RouteTypeEntry[] = [
  { name: "Circular", slug: "circular", active: true },
  { name: "Out-and-back", slug: "out_and_back", active: true },
  { name: "Point to point", slug: "point_to_point", active: true },
  { name: "Loop with variations", slug: "loop_with_variations", active: true },
  { name: "Trail network", slug: "trail_network", active: true },
];

export type RouteTypeSlug = (typeof ROUTE_TYPE_ENUM)[number]["slug"];
