/// <reference types="node" />
/**
 * Master seed runner — executes every seed in dependency order.
 *
 * Usage:
 *   APP_ENV=dev npm run seed:dev
 *   APP_ENV=uat npm run seed:uat
 *
 * Prerequisites: DynamoDB tables must exist (run deploy first).
 */
import "dotenv/config";
import { appName, environment, prefix } from "./config/index.js";
import { seedInterestCategories } from "./interests.js";
import { seedFacilities }         from "./facilities.js";
import { seedAllCategoryThemes }  from "./themes/all.js";
import { seedInterestBasedSkills } from "./skills.js";
import { seedOpportunityThemes }  from "./opportunity/themes.js";
import { seedOpportunityClubV2 }  from "./opportunity/clubs-v2/index.js";
import { seedOpportunityEventsV2 } from "./opportunity/events-v2/index.js";
import { seedOpportunityRouteV2 } from "./opportunity/routes-v2/index.js";
import { seedOpportunityVenuesV2 } from "./opportunity/venues-v2/index.js";

async function loadEnvData(env: string) {
  const data = await import(`./data/${env}/index.js`);
  return data as typeof import("./data/dev/index.js");
}

async function main() {
  console.log(`\n🌱  Seeding ${appName} (env: ${environment}, table prefix: ${prefix})\n`);

  const data = await loadEnvData(environment);

  // ── 1. Reference data (shared across envs) ────────────────────────────────

  console.log("1/9  Interest categories");
  await seedInterestCategories();

  console.log("2/9  Facilities");
  await seedFacilities();

  console.log("3/9  Category themes + variants (opportunity-themes table)");
  await seedAllCategoryThemes();

  console.log("4/9  Opportunity themes (legacy themes table)");
  await seedOpportunityThemes();

  // ── 2. Skills (depends on category themes) ─────────────────────────────────

  console.log("5/9  Interest-based skills");
  await seedInterestBasedSkills();

  // ── 3. Opportunity data (env-specific) ─────────────────────────────────────

  console.log("6/9  Opportunity clubs (v2)");
  await seedOpportunityClubV2(data.opportunityClubV2SeedRows);

  console.log("7/9  Opportunity events (v2)");
  const eventRows = typeof data.opportunityEventV2SeedRows === "function"
    ? data.opportunityEventV2SeedRows()
    : data.opportunityEventV2SeedRows;
  await seedOpportunityEventsV2(eventRows);

  console.log("8/9  Opportunity routes (v2)");
  await seedOpportunityRouteV2(data.opportunityRouteV2SeedRows);

  console.log("9/9  Opportunity venues (v2)");
  await seedOpportunityVenuesV2(data.opportunityVenuesV2SeedItems);

  console.log(`\n✅  All seed data loaded into ${prefix}-* tables.\n`);
}

main().catch((e) => {
  console.error("\n❌  Seed failed:", e);
  process.exit(1);
});
