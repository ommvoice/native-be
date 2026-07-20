export interface KidsFacilityEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const KIDS_FACILITY_ENUM: KidsFacilityEntry[] = [
  { name: "Colouring", slug: "colouring", active: true },
  { name: "Ice creams", slug: "ice_creams", active: true },
  { name: "Activity Sheets or Signs", slug: "activity_sheets", active: true },
  { name: "Activity trail", slug: "activity_trail", active: true },
  { name: "Treasure hunt", slug: "treasure_hunt", active: true },
  { name: "Children’s trail", slug: "childrens_trail", active: true },
  { name: "Clues / games", slug: "clues_games", active: true },
  { name: "Indoor games (puzzles, boards)", slug: "indoor_games", active: true },
  { name: "Sandpit", slug: "sandpit", active: true },
  { name: "Zip Line", slug: "zip_line", active: true },
  { name: "Rope Swings", slug: "rope_swings", active: true },
  { name: "Ride on Vehicles", slug: "ride_on_vehicles", active: true },
  { name: "Tractor Rides", slug: "tractor_rides", active: true },
  { name: "Children's Menu", slug: "childrens_menu", active: true },
  { name: "Swings, Slides, Climbing Frames", slug: "swings_slides", active: true },
  { name: "Indoor Play Space", slug: "soft_play_space", active: true },
  { name: "Outdoor play equipment", slug: "play_equipment", active: true },
];

export type KidsFacilitySlug = (typeof KIDS_FACILITY_ENUM)[number]["slug"];
