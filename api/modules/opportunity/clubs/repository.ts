import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import type { OpportunityClub } from "../../../types/db.js";
import type { CreateOpportunityClubBody } from "./schema.js";

function fromDb(item: Record<string, unknown>): OpportunityClub {
  return {
    id: item.id as string,
    type: "club",
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    venuePostCode: (item.venuePostCode as string | null) ?? null,
    startTime: (item.startTime as string | null) ?? null,
    finishTime: (item.finishTime as string | null) ?? null,
    dayOfWeekSlug: (item.dayOfWeekSlug as string | null) ?? null,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    clubFormatSlug: (item.clubFormatSlug as string | null) ?? null,
    clubFrequencySlug: (item.clubFrequencySlug as string | null) ?? null,
    commitmentSlug: (item.commitmentSlug as string | null) ?? null,
    skillAreaSlug: (item.skillAreaSlug as string | null) ?? null,
    skillAreaVariant: (item.skillAreaVariant as string | null) ?? null,
    abilityLevelSlug: (item.abilityLevelSlug as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    ageSuitabilitySlugs: (item.ageSuitabilitySlugs as string[]) ?? [],
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    interestTags: (item.interestTags as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class OpportunityClubRepository {
  async getAll(): Promise<OpportunityClub[]> {
    const items = await scanAll(TABLES.opportunityClubs);
    return items.map((i) => fromDb(i));
  }

  async getById(id: string): Promise<OpportunityClub | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityClubs, Key: { id } }));
    return res.Item ? fromDb(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityClubBody): Promise<OpportunityClub> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      type: "club",
      name: data.name,
      themeSlug: data.themeSlug,
      createdAt: now,
      updatedAt: now,
      generalFacilitySlugs: data.generalFacilitySlugs ? [...new Set(data.generalFacilitySlugs)] : [],
      kidsFacilitySlugs: data.kidsFacilitySlugs ? [...new Set(data.kidsFacilitySlugs)] : [],
      parentFacilitySlugs: data.parentFacilitySlugs ? [...new Set(data.parentFacilitySlugs)] : [],
      ageSuitabilitySlugs: data.ageSuitabilitySlugs ? [...new Set(data.ageSuitabilitySlugs)] : [],
      extraKitSlugs: data.extraKitSlugs ? [...new Set(data.extraKitSlugs)] : [],
      seasonalHighlightSlugs: data.seasonalHighlightSlugs ? [...new Set(data.seasonalHighlightSlugs)] : [],
      highlightAttractionSlugs: data.highlightAttractionSlugs
        ? [...new Set(data.highlightAttractionSlugs)]
        : [],
    };

    if (data.description !== undefined) item.description = data.description;
    if (data.themeVariantSlug !== undefined) item.themeVariantSlug = data.themeVariantSlug || null;
    if (data.venuePostCode !== undefined) item.venuePostCode = data.venuePostCode;
    if (data.startTime !== undefined) item.startTime = data.startTime;
    if (data.finishTime !== undefined) item.finishTime = data.finishTime;
    if (data.dayOfWeekSlug !== undefined) item.dayOfWeekSlug = data.dayOfWeekSlug || null;
    if (data.activityGroupSlug !== undefined) item.activityGroupSlug = data.activityGroupSlug || null;
    if (data.clubFormatSlug !== undefined) item.clubFormatSlug = data.clubFormatSlug || null;
    if (data.clubFrequencySlug !== undefined) item.clubFrequencySlug = data.clubFrequencySlug || null;
    if (data.commitmentSlug !== undefined) item.commitmentSlug = data.commitmentSlug || null;
    if (data.skillAreaSlug !== undefined) item.skillAreaSlug = data.skillAreaSlug || null;
    if (data.skillAreaVariant !== undefined) item.skillAreaVariant = data.skillAreaVariant;
    if (data.abilityLevelSlug !== undefined) item.abilityLevelSlug = data.abilityLevelSlug || null;
    if (data.parkingProvisionSlug !== undefined) item.parkingProvisionSlug = data.parkingProvisionSlug || null;
    if (data.venueSettingSlug !== undefined) item.venueSettingSlug = data.venueSettingSlug || null;
    if (data.adultCost !== undefined) item.adultCost = data.adultCost;
    if (data.childCost !== undefined) item.childCost = data.childCost;
    if (data.infantCost !== undefined) item.infantCost = data.infantCost;
    if (data.interestTags !== undefined) item.interestTags = data.interestTags;
    if (data.seasonalTagSlug !== undefined) item.seasonalTagSlug = data.seasonalTagSlug || null;

    await db.send(new PutCommand({ TableName: TABLES.opportunityClubs, Item: item }));
    return fromDb(item);
  }
}

export type OpportunityClubRow = OpportunityClub;
