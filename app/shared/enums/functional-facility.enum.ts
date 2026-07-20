export interface FunctionalFacilityEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const FUNCTIONAL_FACILITY_ENUM: FunctionalFacilityEntry[] = [
  { name: "Toilets", slug: "toilets", active: true },
  { name: "Disabled toilets", slug: "disabled_toilets", active: true },
  { name: "Baby changing", slug: "baby_changing", active: true },
  { name: "Showers / changing facilities", slug: "showers_changing", active: true },
  { name: "Bench Seating", slug: "benches", active: true },
  { name: "Picnic Benches", slug: "picnic_benches", active: true },
  { name: "Highchairs", slug: "highchairs", active: true },
  { name: "Indoor Seating", slug: "indoor_seating", active: true },
  { name: "Dogs Allowed", slug: "dogs_allowed", active: true },
  { name: "Guided Tour", slug: "guided_tour", active: true },
  { name: "Service Dogs Only", slug: "service_dogs_only", active: true },
  { name: "Buggy Loan", slug: "buggy_loan", active: true },
  { name: "Baby Carrier Loan", slug: "carrier_loan", active: true },
  { name: "Outdoor Seating", slug: "outdoor_seating", active: true },
];

export type FunctionalFacilitySlug = (typeof FUNCTIONAL_FACILITY_ENUM)[number]["slug"];
