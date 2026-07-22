export interface ExtraKitEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const EXTRA_KIT_ENUM: ExtraKitEntry[] = [
  { name: "Pram / buggy (road surfaces)", slug: "pram_buggy_road", active: true },
  { name: "XC Buggy", slug: "xcountry_buggy", active: true },
  { name: "Sling / baby carrier", slug: "sling_carrier", active: true },
  { name: "Infant / toddler carrier", slug: "toddler_carrier", active: true },
  { name: "Swimming kit", slug: "swimming_kit", active: true },
  { name: "Towels", slug: "towels", active: true },
  { name: "Water shoes", slug: "water_shoes", active: true },
  { name: "Beach toys", slug: "beach_toys", active: true },
  { name: "Sand toys", slug: "sand_toys", active: true },
  { name: "Tide timetable", slug: "tide_times", active: true },
  { name: "Dry bags", slug: "dry_bags", active: true },
  { name: "Buckets & nets", slug: "fishing_nets", active: true },
  { name: "Fishing rods & bait", slug: "fishing_rods_bait", active: true },
  { name: "Wetsuits", slug: "wetsuits", active: true },
  { name: "Wetsuit Boots", slug: "wetsuit_boots", active: true },
  { name: "Snorkel & Mask", slug: "snorkel_mask", active: true },
  { name: "Sun kit (SPF, hats, sunglasses)", slug: "sunshine_kit", active: true },
  { name: "Waterproof clothing", slug: "waterproofs", active: true },
  { name: "Wellies", slug: "wellies", active: true },
  { name: "Change of clothes", slug: "warm_clothes", active: true },
  { name: "Sturdy footwear", slug: "sturdy_footwear", active: true },
  { name: "Torch", slug: "torch", active: true },
  { name: "Headtorch", slug: "headtorch", active: true },
  { name: "Binoculars", slug: "binoculars", active: true },
  { name: "Activity-specific clothing", slug: "activity_specific_clothing", active: true },
  { name: "Chalk Bag", slug: "chalk_bag", active: true },
  { name: "Kite", slug: "kite_play", active: true },
  { name: "Indoor activities (colouring, puzzles)", slug: "indoor_activities_kit", active: true },
  { name: "Cash - no card payments", slug: "cash_payments", active: true },
  { name: "Cashless - bring a bank card", slug: "cashless_payments_only", active: true },
  { name: "Camping Gear", slug: "camping_gear", active: true },
  { name: "Warm change of clothes", slug: "warm_change_of_clothes", active: true },
  { name: "Grip socks", slug: "grip_socks", active: true },
];

export type ExtraKitSlug = (typeof EXTRA_KIT_ENUM)[number]["slug"];
