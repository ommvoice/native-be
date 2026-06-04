import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../config/db.js";
import { TABLES } from "../../config/db.js";
import type { OpportunityRecordType } from "../../config/db.js";

export type OpportunityRouteV2SeedInput = {
  opportunityType?: OpportunityRecordType;
  themeSlug: string;
  themeVariantSlug: string;
  routeName: string;
  [key: string]: unknown;
};

export async function createOpportunityRouteV2Row(input: OpportunityRouteV2SeedInput) {
  const { themeSlug, themeVariantSlug, opportunityType: inputRecordType, ...scalars } = input;
  const opportunityType = (inputRecordType ?? "route") as OpportunityRecordType;
  const id = uuidv4();
  const now = new Date().toISOString();

  const item: Record<string, unknown> = {
    id,
    opportunityType,
    themeSlug: themeSlug.trim(),
    themeVariantSlug: themeVariantSlug.trim(),
    createdAt: now,
    updatedAt: now,
    ...scalars,
  };

  await db.send(new PutCommand({ TableName: TABLES.opportunityRoutesV2, Item: item }));
  return item;
}
