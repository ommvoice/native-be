export interface DogFacilityEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const DOG_FACILITY_ENUM: DogFacilityEntry[] = [
  { name: "Poo Bins", slug: "dog_bins", active: true },
  { name: "Dog Wash", slug: "dog_wash", active: true },
  { name: "(Free) Dog Kennels", slug: "dog_kennels", active: true },
  { name: "Dogs On Leads", slug: "lead_only", active: true },
];

export type DogFacilitySlug = (typeof DOG_FACILITY_ENUM)[number]["slug"];
