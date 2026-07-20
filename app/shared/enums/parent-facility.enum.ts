export interface ParentFacilityEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const PARENT_FACILITY_ENUM: ParentFacilityEntry[] = [
  { name: "Hot Drinks", slug: "hot_drinks", active: true },
  { name: "Comfy Seating / Sofas", slug: "comfy_seating", active: true },
  { name: "Sunloungers", slug: "sunloungers", active: true },
  { name: "WiFi", slug: "wifi", active: true },
  { name: "Hot & Cold food", slug: "hot_cold_food", active: true },
  { name: "Clear Sightlines", slug: "clear_sightlines", active: true },
  { name: "Snacks", slug: "snacks", active: true },
  { name: "Drinks stand", slug: "drinks_stand", active: true },
  { name: "Sweet treats", slug: "sweet_treats", active: true },
  { name: "Log burner", slug: "log_burner", active: true },
  { name: "Bookshop", slug: "book_shop", active: true },
  { name: "Giftshop", slug: "gift_shop", active: true },
  { name: "Outdoor terrace", slug: "outdoor_terrace", active: true },
];

export type ParentFacilitySlug = (typeof PARENT_FACILITY_ENUM)[number]["slug"];
