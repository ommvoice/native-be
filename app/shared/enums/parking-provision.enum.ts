export interface ParkingProvisionEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const PARKING_PROVISION_ENUM: ParkingProvisionEntry[] = [
  { name: "Paid Car Park", slug: "car_parking_paid", active: true },
  { name: "Free Car Park", slug: "car_parking_free", active: true },
  { name: "Members Only Car Park", slug: "car_parking_members_only", active: true },
  { name: "On-street / nearby parking", slug: "on_street_nearby", active: true },
  { name: "Disabled parking bays", slug: "disabled_bays", active: true },
  { name: "Horse “parking”", slug: "horse_parking", active: true },
  { name: "Bike racks / bays", slug: "bike_racks", active: true },
];

export type ParkingProvisionSlug = (typeof PARKING_PROVISION_ENUM)[number]["slug"];
