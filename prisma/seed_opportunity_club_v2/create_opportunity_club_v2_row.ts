import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../api/database/database.config.js";
import { TABLES } from "../../api/database/tables.js";
import type { OpportunityRecordType } from "../../api/types/db.js";

export type OpportunityClubV2SeedInput = {
  opportunityType?: OpportunityRecordType;
  themeSlug: string;
  themeVariantSlug: string;
  clubName: string;
  [key: string]: unknown;
};

function serializeDates(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]),
  );
}

export async function createOpportunityClubV2Row(input: OpportunityClubV2SeedInput) {
  const { themeSlug, themeVariantSlug, opportunityType: inputRecordType, ...scalars } = input;
  const opportunityType = (inputRecordType ?? "club") as OpportunityRecordType;
  const id = uuidv4();
  const now = new Date().toISOString();

  const item: Record<string, unknown> = serializeDates({
    id,
    opportunityType,
    themeSlug: themeSlug.trim(),
    themeVariantSlug: themeVariantSlug.trim(),
    createdAt: now,
    updatedAt: now,
    ...scalars,
  });

  await db.send(new PutCommand({ TableName: TABLES.opportunityClubsV2, Item: item }));
  return item;
}
