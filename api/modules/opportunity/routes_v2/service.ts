import type { OpportunityRecordType, Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityRouteV2Repository } from "./repository.js";
import type { CreateOpportunityRouteV2Body } from "./schema.js";
import type { OpportunityRouteV2Response } from "./types.js";
import { enrichOpportunityRouteV2Response } from "./helpers.js";

const OPTIONAL_OPPORTUNITY_ROUTE_V2_CREATE_FIELDS = [
  "routeActivityGrouping",
  "routeDescription",
  "routeType",
  "routeDistance",
  "routeTerrainType",
  "routeDifficulty",
  "routeAddressLine1",
  "routeAddressLine2",
  "routeRegion",
  "routePostcode",
  "latitude",
  "longitude",
  "routeCountry",
  "routeParkingProvision",
  "routeGeneralFacilities",
  "routeChildFacilities",
  "routeAdultFacilities",
  "routeDogFacilities",
  "routeAgeSuitabilityUnder1S",
  "routeAgeSuitability1To2Years",
  "routeAgeSuitability3To4Years",
  "routeAgeSuitability5To7Years",
  "routeAgeSuitability8To12Years",
  "routeAgeSuitabilityOver13Years",
  "routeAgeSuitabilityAdults",
  "routePhysicalSetting",
  "routeDetailedWeatherSuitability",
  "routeEstimatedDuration",
  "routeInterestTags",
  "routeSeasonalTag",
  "routeSeasonalHighlights",
  "routeAttractions",
  "routeExtraKit",
  "image",
] as const satisfies readonly (keyof Prisma.OpportunityRouteV2UncheckedCreateInput)[];

function pickOptionalCreateFields(
  body: CreateOpportunityRouteV2Body,
): Partial<Prisma.OpportunityRouteV2UncheckedCreateInput> {
  const out: Partial<Prisma.OpportunityRouteV2UncheckedCreateInput> = {};
  for (const key of OPTIONAL_OPPORTUNITY_ROUTE_V2_CREATE_FIELDS) {
    const v = body[key];
    if (v !== undefined) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}

export class OpportunityRouteV2Service {
  constructor(private repository: OpportunityRouteV2Repository) {}

  async getAll(): Promise<OpportunityRouteV2Response[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityRouteV2Response);
  }

  async getById(id: string): Promise<OpportunityRouteV2Response> {
    const row = await this.repository.getById(id);
    if (!row) throw new AppError(404, "Opportunity route (v2) not found");
    return enrichOpportunityRouteV2Response(row);
  }

  async create(
    data: CreateOpportunityRouteV2Body,
  ): Promise<OpportunityRouteV2Response> {
    const recordType = (data.opportunityType ?? "route") as OpportunityRecordType;

    const theme = await prisma.opportunityTheme.findFirst({
      where: { recordType, slug: data.themeSlug.trim() },
    });
    if (!theme) {
      throw new AppError(
        400,
        "themeSlug does not match an opportunity theme for this record type",
      );
    }

    const themeVariant = await prisma.opportunityThemeVariant.findFirst({
      where: {
        themeId: theme.id,
        slug: data.themeVariantSlug.trim(),
      },
    });
    if (!themeVariant) {
      throw new AppError(
        400,
        "themeVariantSlug does not match a variant for the selected theme",
      );
    }

    const prismaData: Prisma.OpportunityRouteV2UncheckedCreateInput = {
      themeId: theme.id,
      themeVariantId: themeVariant.id,
      routeName: data.routeName.trim(),
      opportunityType: recordType,
      ...pickOptionalCreateFields(data),
    };

    const created = await this.repository.create(prismaData);
    return enrichOpportunityRouteV2Response(created);
  }
}
