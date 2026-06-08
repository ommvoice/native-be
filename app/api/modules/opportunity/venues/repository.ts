import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import type { OpportunityVenue } from "../../../types/db.js";
import type { CreateOpportunityVenueBody } from "./schema.js";

function fromDb(item: Record<string, unknown>): OpportunityVenue {
  return {
    id: item.id as string,
    type: "venue",
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    venuePostcode: (item.venuePostcode as string | null) ?? null,
    openingDaysAndTimes: (item.openingDaysAndTimes as string | null) ?? null,
    openingExclusions: (item.openingExclusions as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    terrainTypeSlug: (item.terrainTypeSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    dogFacilitySlugs: (item.dogFacilitySlugs as string[]) ?? [],
    ageSuitabilitySlugs: (item.ageSuitabilitySlugs as string[]) ?? [],
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    interestTags: (item.interestTags as string | null) ?? null,
    estimatedTimeToSpend: (item.estimatedTimeToSpend as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class OpportunityVenueRepository {
  async getAll(): Promise<OpportunityVenue[]> {
    const items = await scanAll(TABLES.opportunityVenues);
    return items.map((i) => fromDb(i));
  }

  async getById(id: string): Promise<OpportunityVenue | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityVenues, Key: { id } }));
    return res.Item ? fromDb(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityVenueBody): Promise<OpportunityVenue> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      type: "venue",
      name: data.name,
      themeSlug: data.themeSlug,
      createdAt: now,
      updatedAt: now,
      generalFacilitySlugs: data.generalFacilitySlugs ? [...new Set(data.generalFacilitySlugs)] : [],
      kidsFacilitySlugs: data.kidsFacilitySlugs ? [...new Set(data.kidsFacilitySlugs)] : [],
      parentFacilitySlugs: data.parentFacilitySlugs ? [...new Set(data.parentFacilitySlugs)] : [],
      dogFacilitySlugs: data.dogFacilitySlugs ? [...new Set(data.dogFacilitySlugs)] : [],
      ageSuitabilitySlugs: data.ageSuitabilitySlugs ? [...new Set(data.ageSuitabilitySlugs)] : [],
      extraKitSlugs: data.extraKitSlugs ? [...new Set(data.extraKitSlugs)] : [],
      seasonalHighlightSlugs: data.seasonalHighlightSlugs ? [...new Set(data.seasonalHighlightSlugs)] : [],
      highlightAttractionSlugs: data.highlightAttractionSlugs
        ? [...new Set(data.highlightAttractionSlugs)]
        : [],
    };

    if (data.description !== undefined) item.description = data.description;
    if (data.venuePostCode !== undefined) item.venuePostcode = data.venuePostCode || null;
    if (data.openingDaysAndTimes !== undefined) item.openingDaysAndTimes = data.openingDaysAndTimes;
    if (data.openingExclusions !== undefined) item.openingExclusions = data.openingExclusions;
    if (data.themeVariantSlug !== undefined) item.themeVariantSlug = data.themeVariantSlug || null;
    if (data.activityGroupSlug !== undefined) item.activityGroupSlug = data.activityGroupSlug || null;
    if (data.terrainTypeSlug !== undefined) item.terrainTypeSlug = data.terrainTypeSlug || null;
    if (data.venueSettingSlug !== undefined) item.venueSettingSlug = data.venueSettingSlug || null;
    if (data.parkingProvisionSlug !== undefined) item.parkingProvisionSlug = data.parkingProvisionSlug || null;
    if (data.adultCost !== undefined) item.adultCost = data.adultCost;
    if (data.childCost !== undefined) item.childCost = data.childCost;
    if (data.infantCost !== undefined) item.infantCost = data.infantCost;
    if (data.interestTags !== undefined) item.interestTags = data.interestTags;
    if (data.estimatedTimeToSpend !== undefined) item.estimatedTimeToSpend = data.estimatedTimeToSpend;
    if (data.seasonalTagSlug !== undefined) item.seasonalTagSlug = data.seasonalTagSlug || null;

    await db.send(new PutCommand({ TableName: TABLES.opportunityVenues, Item: item }));
    return fromDb(item);
  }
}

export type OpportunityVenueRow = OpportunityVenue;
