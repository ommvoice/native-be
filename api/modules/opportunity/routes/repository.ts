import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import type { OpportunityRoute } from "../../../types/db.js";
import type { CreateOpportunityRouteBody } from "./schema.js";

function fromDb(item: Record<string, unknown>): OpportunityRoute {
  return {
    id: item.id as string,
    type: "route",
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    routeTypeSlug: (item.routeTypeSlug as string | null) ?? null,
    routeDistanceMiles: (item.routeDistanceMiles as number | null) ?? null,
    routeSuitabilitySlugs: (item.routeSuitabilitySlugs as string[]) ?? [],
    terrainTypeSlugs: (item.terrainTypeSlugs as string[]) ?? [],
    difficultyRatingSlug: (item.difficultyRatingSlug as string | null) ?? null,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    startPointPostCode: (item.startPointPostCode as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    dogFacilitySlugs: (item.dogFacilitySlugs as string[]) ?? [],
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    interestTags: (item.interestTags as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class OpportunityRouteRepository {
  async getAll(): Promise<OpportunityRoute[]> {
    const items = await scanAll(TABLES.opportunityRoutes);
    return items.map((i) => fromDb(i));
  }

  async getById(id: string): Promise<OpportunityRoute | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityRoutes, Key: { id } }));
    return res.Item ? fromDb(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityRouteBody): Promise<OpportunityRoute> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      type: "route",
      name: data.name,
      themeSlug: data.themeSlug,
      createdAt: now,
      updatedAt: now,
      routeSuitabilitySlugs: data.routeSuitabilitySlugs ? [...new Set(data.routeSuitabilitySlugs)] : [],
      terrainTypeSlugs: data.terrainTypeSlugs ? [...new Set(data.terrainTypeSlugs)] : [],
      generalFacilitySlugs: data.generalFacilitySlugs ? [...new Set(data.generalFacilitySlugs)] : [],
      kidsFacilitySlugs: data.kidsFacilitySlugs ? [...new Set(data.kidsFacilitySlugs)] : [],
      parentFacilitySlugs: data.parentFacilitySlugs ? [...new Set(data.parentFacilitySlugs)] : [],
      dogFacilitySlugs: data.dogFacilitySlugs ? [...new Set(data.dogFacilitySlugs)] : [],
      extraKitSlugs: data.extraKitSlugs ? [...new Set(data.extraKitSlugs)] : [],
      seasonalHighlightSlugs: data.seasonalHighlightSlugs ? [...new Set(data.seasonalHighlightSlugs)] : [],
      highlightAttractionSlugs: data.highlightAttractionSlugs
        ? [...new Set(data.highlightAttractionSlugs)]
        : [],
    };

    if (data.description !== undefined) item.description = data.description;
    if (data.themeVariantSlug !== undefined) item.themeVariantSlug = data.themeVariantSlug || null;
    if (data.routeTypeSlug !== undefined) item.routeTypeSlug = data.routeTypeSlug || null;
    if (data.routeDistanceMiles !== undefined) item.routeDistanceMiles = data.routeDistanceMiles;
    if (data.difficultyRatingSlug !== undefined) item.difficultyRatingSlug = data.difficultyRatingSlug || null;
    if (data.activityGroupSlug !== undefined) item.activityGroupSlug = data.activityGroupSlug || null;
    if (data.startPointPostCode !== undefined) item.startPointPostCode = data.startPointPostCode;
    if (data.parkingProvisionSlug !== undefined) item.parkingProvisionSlug = data.parkingProvisionSlug || null;
    if (data.venueSettingSlug !== undefined) item.venueSettingSlug = data.venueSettingSlug || null;
    if (data.adultCost !== undefined) item.adultCost = data.adultCost;
    if (data.childCost !== undefined) item.childCost = data.childCost;
    if (data.infantCost !== undefined) item.infantCost = data.infantCost;
    if (data.interestTags !== undefined) item.interestTags = data.interestTags;
    if (data.seasonalTagSlug !== undefined) item.seasonalTagSlug = data.seasonalTagSlug || null;

    await db.send(new PutCommand({ TableName: TABLES.opportunityRoutes, Item: item }));
    return fromDb(item);
  }
}

export type OpportunityRouteRow = OpportunityRoute;
