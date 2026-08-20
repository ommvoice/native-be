import "dotenv/config";
import { TABLES } from "../seed/config/index.js";

const TABLE_ENV_VARS: Record<string, string> = {
  users:         "TABLE_USERS",
  parents:       "TABLE_PARENTS",
  children:      "TABLE_CHILDREN",
  drivingLegs:   "TABLE_DRIVING_LEGS",
  wishlists:     "TABLE_WISHLISTS",
  wishlistItems: "TABLE_WISHLIST_ITEMS",
  venues:        "TABLE_VENUES",
  events:        "TABLE_EVENTS",
  clubs:         "TABLE_CLUBS",
  routes:        "TABLE_ROUTES",
};

for (const [key, tableName] of Object.entries(TABLES)) {
  const envVar = TABLE_ENV_VARS[key];
  if (envVar) process.env[envVar] = tableName;
}

import { RecommendationV2Service } from "../app/services/recommendation-v2.service.js";
import params from "../app/shared/assets/params.json" with { type: "json" };
import type { Narrowed } from "../app/shared/types/assets.types.js";
import { RecommendationV2Repository } from "../app/repositories/recommendation-v2.repository.js";

const narrowed: Narrowed = {
  ...params.narrowed,
  children: params.narrowed.children.map((c) => ({
    ...c,
    dateOfBirth: new Date(c.dateOfBirth),
  })),
};

async function main() {
  const repo = new RecommendationV2Repository()
  const service = new RecommendationV2Service();

  // let canditates  = await repo.getOpportunityCandidatesV2();

  const result = await service.getItemsWithScore(narrowed);

  console.log("ya", JSON.stringify(result, null, 2));
}

main().catch(console.error);
