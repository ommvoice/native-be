/// <reference types="node" />
/**
 * Master seed runner — executes every seed in dependency order.
 *
 * Usage:
 *   npm run seed:all
 *   APP_ENV=staging npm run seed:all
 *
 * Prerequisites: DynamoDB tables must exist (run npm run deploy first).
 */
import "dotenv/config";
import { seedInterestCategories } from "./interests.js";
import { seedFacilities }         from "./facilities.js";
import { seedAllCategoryThemes }  from "./themes/all.js";
import { seedInterestBasedSkills } from "./skills.js";
import { seedOpportunityThemes }  from "./opportunity/themes.js";
import { seedOpportunityClubV2 }  from "./opportunity/clubs-v2/index.js";
import { seedOpportunityEventsV2 } from "./opportunity/events-v2/index.js";
import { seedOpportunityRouteV2 } from "./opportunity/routes-v2/index.js";
import { seedOpportunityVenuesV2 } from "./opportunity/venues-v2/index.js";

async function main() {
  const env = "dev";
  const appName = "native-be";
  const prefix  = `${appName}-${env}`;

  console.log(`\n🌱  Seeding ${appName} (env: ${env}, table prefix: ${prefix})\n`);

  // ── 1. Reference data ──────────────────────────────────────────────────────

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

  // ── 3. Opportunity data (v2) ───────────────────────────────────────────────

  console.log("6/9  Opportunity clubs (v2)");
  await seedOpportunityClubV2();

  console.log("7/9  Opportunity events (v2)");
  await seedOpportunityEventsV2();

  console.log("8/9  Opportunity routes (v2)");
  await seedOpportunityRouteV2();

  console.log("9/9  Opportunity venues (v2)");
  await seedOpportunityVenuesV2();

  console.log(`\n✅  All seed data loaded into ${prefix}-* tables.\n`);
}

main().catch((e) => {
  console.error("\n❌  Seed failed:", e);
  process.exit(1);
});
