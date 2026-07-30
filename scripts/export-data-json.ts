/// <reference types="node" />
/**
 * Exports the generated enum + seed data into plain JSON assets under
 * app/shared/assets/: enums.json, clubs.json, events.json, routes.json,
 * venues.json.
 *
 * Source of truth for each is still the generated TypeScript (seed/data/uat/enums
 * and seed/data/uat/{clubs,events,routes,venues}-v2/) — this script just
 * snapshots that data as JSON for consumers that want a plain data file
 * instead of importing TS modules. Re-run any time the enums or seed data
 * scripts (generate-enums.ts, parse-*-data.ts) are re-run.
 *
 * Usage: npx tsx scripts/export-data-json.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as ENUMS from "../seed/data/uat/enums/index.js";
import { opportunityClubV2SeedRows } from "../seed/data/uat/clubs-v2/index.js";
import { opportunityEventV2SeedRows } from "../seed/data/uat/events-v2/index.js";
import { opportunityRouteV2SeedRows } from "../seed/data/uat/routes-v2/index.js";
import { opportunityVenuesV2SeedItems } from "../seed/data/uat/venues-v2/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "app", "shared", "assets");

// Same camelCase keying as the /enums API endpoint (app/lambdas/enums/list.ts) — keep the two in sync.
const ENUMS_JSON = {
  opportunityType: ENUMS.OPPORTUNITY_TYPE_ENUM,
  activityGroup: ENUMS.ACTIVITY_GROUP_ENUM,
  interestCategory: ENUMS.INTEREST_CATEGORY_ENUM,
  generalSkill: ENUMS.GENERAL_SKILL_ENUM,
  weatherSuitability: ENUMS.WEATHER_SUITABILITY_ENUM,
  physicalSetting: ENUMS.PHYSICAL_SETTING_ENUM,
  ageSuitability: ENUMS.AGE_SUITABILITY_ENUM,
  estimatedDuration: ENUMS.ESTIMATED_DURATION_ENUM,
  functionalFacility: ENUMS.FUNCTIONAL_FACILITY_ENUM,
  parentFacility: ENUMS.PARENT_FACILITY_ENUM,
  kidsFacility: ENUMS.KIDS_FACILITY_ENUM,
  dogFacility: ENUMS.DOG_FACILITY_ENUM,
  parkingProvision: ENUMS.PARKING_PROVISION_ENUM,
  extraKit: ENUMS.EXTRA_KIT_ENUM,
  seasonalTag: ENUMS.SEASONAL_TAG_ENUM,
  routeType: ENUMS.ROUTE_TYPE_ENUM,
  routeSuitability: ENUMS.ROUTE_SUITABILITY_ENUM,
  terrainType: ENUMS.TERRAIN_TYPE_ENUM,
  routeDifficulty: ENUMS.ROUTE_DIFFICULTY_ENUM,
  clubFormat: ENUMS.CLUB_FORMAT_ENUM,
  clubFrequency: ENUMS.CLUB_FREQUENCY_ENUM,
  clubCommitment: ENUMS.CLUB_COMMITMENT_ENUM,
  skillArea: ENUMS.SKILL_AREA_ENUM,
  abilityLevel: ENUMS.ABILITY_LEVEL_ENUM,
  eventType: ENUMS.EVENT_TYPE_ENUM,
  bookingType: ENUMS.BOOKING_TYPE_ENUM,
  ticketVariant: ENUMS.TICKET_VARIANT_ENUM,
  opportunityTheme: ENUMS.OPPORTUNITY_THEME_ENUM,
  opportunityThemeVariant: ENUMS.OPPORTUNITY_THEME_VARIANT_ENUM,
  skillAreaVariant: ENUMS.SKILL_AREA_VARIANT_ENUM,
  seasonalHighlight: ENUMS.SEASONAL_HIGHLIGHT_ENUM,
  themeAttraction: ENUMS.THEME_ATTRACTION_ENUM,
};

function writeJson(fileName: string, data: unknown): void {
  fs.writeFileSync(path.join(OUTPUT_DIR, fileName), JSON.stringify(data, null, 2) + "\n");
}

function main(): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // writeJson("enums.json", ENUMS_JSON);
  // writeJson("clubs.json", opportunityClubV2SeedRows);
  // writeJson("events.json", opportunityEventV2SeedRows);
  // writeJson("routes.json", opportunityRouteV2SeedRows);
  writeJson("venues.json", opportunityVenuesV2SeedItems);

  console.log(`Exported JSON assets to ${path.relative(process.cwd(), OUTPUT_DIR)}:`);
  // console.log(`  enums.json  — ${Object.keys(ENUMS_JSON).length} enum groups`);
  // console.log(`  clubs.json  — ${opportunityClubV2SeedRows.length} clubs`);
  // console.log(`  events.json — ${opportunityEventV2SeedRows.length} events`);
  // console.log(`  routes.json — ${opportunityRouteV2SeedRows.length} routes`);
  console.log(`  venues.json — ${opportunityVenuesV2SeedItems.length} venues`);
}

main();
