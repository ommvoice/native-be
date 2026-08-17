import "dotenv/config";
import { RecommendationV2Service } from "../app/services/recommendation-v2.service.js"
import params from "../app/shared/assets/params.json" with { type: "json" };
import type { Narrowed } from "../app/shared/types/assets.types.js";

const narrowed: Narrowed = {
  ...params.narrowed,
  children: params.narrowed.children.map((c) => ({
    ...c,
    dateOfBirth: new Date(c.dateOfBirth),
  })),
};

async function main() {
  const service = new RecommendationV2Service();
  const result = await service.getItemsWithScore(narrowed);

  console.log("ya", JSON.stringify(result, null, 2));
}

main().catch(console.error);
