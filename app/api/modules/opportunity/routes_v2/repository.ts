import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import { enrichOpportunityRouteV2Response } from "./helpers.js";
import type { OpportunityRouteV2Response } from "./types.js";
import type { CreateOpportunityRouteV2Body } from "./schema.js";

export class OpportunityRouteV2Repository {
  async getAll(): Promise<OpportunityRouteV2Response[]> {
    const items = await scanAll(TABLES.opportunityRoutesV2);
    return items.map(enrichOpportunityRouteV2Response);
  }

  async getById(id: string): Promise<OpportunityRouteV2Response | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityRoutesV2, Key: { id } }));
    return res.Item ? enrichOpportunityRouteV2Response(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityRouteV2Body): Promise<OpportunityRouteV2Response> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      opportunityType: data.opportunityType ?? "route",
      themeSlug: data.themeSlug.trim(),
      themeVariantSlug: data.themeVariantSlug.trim(),
      routeName: data.routeName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const set = (k: string, v: unknown) => {
      if (v !== undefined) item[k] = v;
    };

    set("routeActivityGrouping", data.routeActivityGrouping);
    set("routeDescription", data.routeDescription);
    set("routeType", data.routeType);
    set("routeDistance", data.routeDistance);
    set("routeTerrainType", data.routeTerrainType);
    set("routeDifficulty", data.routeDifficulty);
    set("routeAddressLine1", data.routeAddressLine1);
    set("routeAddressLine2", data.routeAddressLine2);
    set("routeRegion", data.routeRegion);
    set("routePostcode", data.routePostcode);
    set("latitude", data.latitude);
    set("longitude", data.longitude);
    set("routeCountry", data.routeCountry);
    set("routeParkingProvision", data.routeParkingProvision);
    set("routeGeneralFacilities", data.routeGeneralFacilities);
    set("routeChildFacilities", data.routeChildFacilities);
    set("routeAdultFacilities", data.routeAdultFacilities);
    set("routeDogFacilities", data.routeDogFacilities);
    set("routeAgeSuitabilityUnder1S", data.routeAgeSuitabilityUnder1S);
    set("routeAgeSuitability1To2Years", data.routeAgeSuitability1To2Years);
    set("routeAgeSuitability3To4Years", data.routeAgeSuitability3To4Years);
    set("routeAgeSuitability5To7Years", data.routeAgeSuitability5To7Years);
    set("routeAgeSuitability8To12Years", data.routeAgeSuitability8To12Years);
    set("routeAgeSuitabilityOver13Years", data.routeAgeSuitabilityOver13Years);
    set("routeAgeSuitabilityAdults", data.routeAgeSuitabilityAdults);
    set("routePhysicalSetting", data.routePhysicalSetting);
    set("routeDetailedWeatherSuitability", data.routeDetailedWeatherSuitability);
    set("routeEstimatedDuration", data.routeEstimatedDuration);
    set("routeInterestTags", data.routeInterestTags);
    set("routeSeasonalTag", data.routeSeasonalTag);
    set("routeSeasonalHighlights", data.routeSeasonalHighlights);
    set("routeAttractions", data.routeAttractions);
    set("routeExtraKit", data.routeExtraKit);
    set("image", data.image);

    await db.send(new PutCommand({ TableName: TABLES.opportunityRoutesV2, Item: item }));
    return enrichOpportunityRouteV2Response(item);
  }
}
