import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import type { OpportunityEvent } from "../../../types/db.js";
import type { CreateOpportunityEventBody } from "./schema.js";

function fromDb(item: Record<string, unknown>): OpportunityEvent {
  return {
    id: item.id as string,
    type: "event",
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    eventTypeSlug: item.eventTypeSlug as string,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    startDate: item.startDate ? new Date(item.startDate as string) : null,
    endDate: item.endDate ? new Date(item.endDate as string) : null,
    startTime: (item.startTime as string | null) ?? null,
    finishTime: (item.finishTime as string | null) ?? null,
    venuePostCode: (item.venuePostCode as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    ageSuitabilitySlugs: (item.ageSuitabilitySlugs as string[]) ?? [],
    skillAreaSlug: (item.skillAreaSlug as string | null) ?? null,
    skillAreaVariant: (item.skillAreaVariant as string | null) ?? null,
    abilityLevelSlug: (item.abilityLevelSlug as string | null) ?? null,
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    interestTags: (item.interestTags as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class OpportunityEventRepository {
  async getAll(): Promise<OpportunityEvent[]> {
    const items = await scanAll(TABLES.opportunityEvents);
    return items.map((i) => fromDb(i));
  }

  async getById(id: string): Promise<OpportunityEvent | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityEvents, Key: { id } }));
    return res.Item ? fromDb(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityEventBody): Promise<OpportunityEvent> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      type: "event",
      name: data.name,
      themeSlug: data.themeSlug,
      eventTypeSlug: data.eventTypeSlug,
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
    if (data.activityGroupSlug !== undefined) item.activityGroupSlug = data.activityGroupSlug || null;
    if (data.startDate != null) item.startDate = new Date(data.startDate).toISOString();
    if (data.endDate != null) item.endDate = new Date(data.endDate).toISOString();
    if (data.startTime !== undefined) item.startTime = data.startTime;
    if (data.finishTime !== undefined) item.finishTime = data.finishTime;
    if (data.venuePostCode !== undefined) item.venuePostCode = data.venuePostCode;
    if (data.parkingProvisionSlug !== undefined) item.parkingProvisionSlug = data.parkingProvisionSlug || null;
    if (data.venueSettingSlug !== undefined) item.venueSettingSlug = data.venueSettingSlug || null;
    if (data.adultCost !== undefined) item.adultCost = data.adultCost;
    if (data.childCost !== undefined) item.childCost = data.childCost;
    if (data.infantCost !== undefined) item.infantCost = data.infantCost;
    if (data.skillAreaSlug !== undefined) item.skillAreaSlug = data.skillAreaSlug || null;
    if (data.skillAreaVariant !== undefined) item.skillAreaVariant = data.skillAreaVariant;
    if (data.abilityLevelSlug !== undefined) item.abilityLevelSlug = data.abilityLevelSlug || null;
    if (data.interestTags !== undefined) item.interestTags = data.interestTags;
    if (data.seasonalTagSlug !== undefined) item.seasonalTagSlug = data.seasonalTagSlug || null;

    await db.send(new PutCommand({ TableName: TABLES.opportunityEvents, Item: item }));
    return fromDb(item);
  }
}

export type OpportunityEventWithRelations = OpportunityEvent;
