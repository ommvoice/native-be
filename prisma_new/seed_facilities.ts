import type { FacilityType, PrismaClient } from "@prisma/client";

/** Source rows for `seedFacilities` and corridor opportunity seeds (slugs match opportunity `*FacilitySlugs` columns). */
export const FACILITY_ROWS: { type: FacilityType; slug: string; label: string }[] = [
  // General
  { type: "GENERAL", slug: "toilets", label: "Toilets" },
  { type: "GENERAL", slug: "disabled_toilets", label: "Disabled toilets" },
  { type: "GENERAL", slug: "baby_changing", label: "Baby changing" },
  {
    type: "GENERAL",
    slug: "showers_changing",
    label: "Showers / changing facilities",
  },
  { type: "GENERAL", slug: "benches", label: "Bench Seating" },
  { type: "GENERAL", slug: "picnic_benches", label: "Picnic Benches" },
  { type: "GENERAL", slug: "indoor_seating", label: "Indoor Seating" },
  { type: "GENERAL", slug: "outdoor_seating", label: "Outdoor Seating" },
  // Parent
  { type: "PARENT", slug: "hot_drinks", label: "Hot Drinks" },
  {
    type: "PARENT",
    slug: "comfy_seating",
    label: "Comfy Seating / Sofas",
  },
  { type: "PARENT", slug: "sunloungers", label: "Sunloungers" },
  { type: "PARENT", slug: "wifi", label: "WiFi" },
  { type: "PARENT", slug: "hot_cold_food", label: "Hot & Cold food" },
  { type: "PARENT", slug: "clear_sightlines", label: "Clear Sightlines" },
  { type: "PARENT", slug: "snacks", label: "Snacks" },
  { type: "PARENT", slug: "drinks_stand", label: "Drinks stand" },
  { type: "PARENT", slug: "sweet_treats", label: "Sweet treats" },
  { type: "PARENT", slug: "log_burner", label: "Log burner" },
  { type: "PARENT", slug: "outdoor_terrace", label: "Outdoor terrace" },
  // Kid
  { type: "KID", slug: "colouring", label: "Colouring" },
  { type: "KID", slug: "ice_creams", label: "Ice creams" },
  { type: "KID", slug: "activity_sheets", label: "Activity sheets" },
  { type: "KID", slug: "activity_trail", label: "Activity trail" },
  { type: "KID", slug: "treasure_hunt", label: "Treasure hunt" },
  { type: "KID", slug: "childrens_trail", label: "Children's trail" },
  { type: "KID", slug: "clues_games", label: "Clues / games" },
  {
    type: "KID",
    slug: "indoor_games",
    label: "Indoor games (puzzles, boards)",
  },
  { type: "KID", slug: "play_equipment", label: "Play equipment" },
  // Dog
  { type: "DOG", slug: "dog_bins", label: "Poo Bins" },
  { type: "DOG", slug: "dog_wash", label: "Dog Wash" },
  { type: "DOG", slug: "lead_only", label: "Dogs On Leads" },
];

export async function seedFacilities(prisma: PrismaClient) {
  await prisma.facility.deleteMany();
  await prisma.facility.createMany({ data: FACILITY_ROWS });
}
