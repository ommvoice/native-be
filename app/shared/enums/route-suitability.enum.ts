export interface RouteSuitabilityEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const ROUTE_SUITABILITY_ENUM: RouteSuitabilityEntry[] = [
  { name: "Buggy friendly", slug: "buggy_friendly", active: true },
  { name: "Dog friendly", slug: "dog_friendly", active: true },
  { name: "Scooter route", slug: "scooter_route", active: true },
  { name: "Cycle route", slug: "cycle_route", active: true },
  { name: "Mountain Bikes Only", slug: "bike_route", active: true },
  { name: "Wheelchair friendly", slug: "wheelchair_friendly", active: true },
  { name: "Carrier Only", slug: "carrier_only", active: true },
  { name: "Off-road Buggies only", slug: "offroad_buggy_only", active: true },
];

export type RouteSuitabilitySlug = (typeof ROUTE_SUITABILITY_ENUM)[number]["slug"];
