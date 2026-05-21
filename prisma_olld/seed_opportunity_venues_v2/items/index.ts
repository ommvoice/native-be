import type { OpportunityVenueV2SeedInput } from "../create_opportunity_venue_v2.js";
import { candysFieldPlayParkVenueV2 } from "./candys_field_play_park.js";
import { castleDrogoEstateNtVenueV2 } from "./castle_drogo_estate_nt.js";
import { exmouthQueensParadePlayAreaVenueV2 } from "./exmouth_queens_parade_play_area.js";
import { extonChildrensPlayAreaVenueV2 } from "./exton_childrens_play_area.js";
import { theHamPlayParkVenueV2 } from "./the_ham_play_park.js";

/** Append one export per file under `items/` and register it here. */
export const opportunityVenuesV2SeedItems: OpportunityVenueV2SeedInput[] = [
  castleDrogoEstateNtVenueV2,
  extonChildrensPlayAreaVenueV2,
  theHamPlayParkVenueV2,
  candysFieldPlayParkVenueV2,
  exmouthQueensParadePlayAreaVenueV2,
];
