import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../api/database/database.config.js";
import { TABLES } from "../../api/database/tables.js";

export type OpportunityVenueV2SeedInput = {
  themeSlug: string;
  themeVariantSlug: string;
  venueName: string;
  [key: string]: unknown;
};

export async function createOpportunityVenueV2Seed(input: OpportunityVenueV2SeedInput) {
  const { themeSlug, themeVariantSlug, ...scalars } = input;
  const id = uuidv4();
  const now = new Date().toISOString();

  const item: Record<string, unknown> = {
    id,
    opportunityType: "venue",
    themeSlug: themeSlug.trim(),
    themeVariantSlug: themeVariantSlug.trim(),
    createdAt: now,
    updatedAt: now,
    ...scalars,
  };

  await db.send(new PutCommand({ TableName: TABLES.opportunityVenuesV2, Item: item }));
  return item;
}
