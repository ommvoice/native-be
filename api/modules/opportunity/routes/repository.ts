import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import type { CreateOpportunityRouteBody } from "./schema.js";

export class OpportunityRouteRepository {
  async getAll() {
    return prisma.opportunityRoute.findMany();
  }

  async getById(id: string) {
    return prisma.opportunityRoute.findUnique({
      where: { id },
    });
  }

  async create(data: CreateOpportunityRouteBody) {
    const {
      generalFacilitySlugs,
      kidsFacilitySlugs,
      parentFacilitySlugs,
      dogFacilitySlugs,
      extraKitSlugs,
      seasonalHighlightSlugs,
      highlightAttractionSlugs,
      routeSuitabilitySlugs,
      terrainTypeSlugs,
      ...scalars
    } = data;

    const prismaData: Prisma.OpportunityRouteUncheckedCreateInput = {
      name: scalars.name,
      themeSlug: scalars.themeSlug,
    };

    if (scalars.description !== undefined) {
      prismaData.description = scalars.description;
    }
    if (scalars.themeVariantSlug !== undefined) {
      prismaData.themeVariantSlug =
        scalars.themeVariantSlug === null || scalars.themeVariantSlug === ""
          ? null
          : scalars.themeVariantSlug;
    }
    if (scalars.routeTypeSlug !== undefined) {
      prismaData.routeTypeSlug =
        scalars.routeTypeSlug === null || scalars.routeTypeSlug === ""
          ? null
          : scalars.routeTypeSlug;
    }
    if (scalars.routeDistanceMiles !== undefined) {
      prismaData.routeDistanceMiles = scalars.routeDistanceMiles;
    }
    if (scalars.difficultyRatingSlug !== undefined) {
      prismaData.difficultyRatingSlug =
        scalars.difficultyRatingSlug === null ||
        scalars.difficultyRatingSlug === ""
          ? null
          : scalars.difficultyRatingSlug;
    }
    if (scalars.activityGroupSlug !== undefined) {
      prismaData.activityGroupSlug =
        scalars.activityGroupSlug === null || scalars.activityGroupSlug === ""
          ? null
          : scalars.activityGroupSlug;
    }
    if (scalars.startPointPostCode !== undefined) {
      prismaData.startPointPostCode = scalars.startPointPostCode;
    }
    if (scalars.parkingProvisionSlug !== undefined) {
      prismaData.parkingProvisionSlug =
        scalars.parkingProvisionSlug === null ||
        scalars.parkingProvisionSlug === ""
          ? null
          : scalars.parkingProvisionSlug;
    }
    if (scalars.venueSettingSlug !== undefined) {
      prismaData.venueSettingSlug =
        scalars.venueSettingSlug === null || scalars.venueSettingSlug === ""
          ? null
          : scalars.venueSettingSlug;
    }
    if (scalars.adultCost !== undefined) {
      prismaData.adultCost = scalars.adultCost;
    }
    if (scalars.childCost !== undefined) {
      prismaData.childCost = scalars.childCost;
    }
    if (scalars.infantCost !== undefined) {
      prismaData.infantCost = scalars.infantCost;
    }
    if (scalars.interestTags !== undefined) {
      prismaData.interestTags = scalars.interestTags;
    }
    if (scalars.seasonalTagSlug !== undefined) {
      prismaData.seasonalTagSlug =
        scalars.seasonalTagSlug === null || scalars.seasonalTagSlug === ""
          ? null
          : scalars.seasonalTagSlug;
    }

    if (routeSuitabilitySlugs !== undefined) {
      prismaData.routeSuitabilitySlugs = [...new Set(routeSuitabilitySlugs)];
    }
    if (terrainTypeSlugs !== undefined) {
      prismaData.terrainTypeSlugs = [...new Set(terrainTypeSlugs)];
    }
    if (generalFacilitySlugs !== undefined) {
      prismaData.generalFacilitySlugs = [...new Set(generalFacilitySlugs)];
    }
    if (kidsFacilitySlugs !== undefined) {
      prismaData.kidsFacilitySlugs = [...new Set(kidsFacilitySlugs)];
    }
    if (parentFacilitySlugs !== undefined) {
      prismaData.parentFacilitySlugs = [...new Set(parentFacilitySlugs)];
    }
    if (dogFacilitySlugs !== undefined) {
      prismaData.dogFacilitySlugs = [...new Set(dogFacilitySlugs)];
    }
    if (extraKitSlugs !== undefined) {
      prismaData.extraKitSlugs = [...new Set(extraKitSlugs)];
    }
    if (seasonalHighlightSlugs !== undefined) {
      prismaData.seasonalHighlightSlugs = [
        ...new Set(seasonalHighlightSlugs),
      ];
    }
    if (highlightAttractionSlugs !== undefined) {
      prismaData.highlightAttractionSlugs = [
        ...new Set(highlightAttractionSlugs),
      ];
    }

    return prisma.opportunityRoute.create({
      data: prismaData,
    });
  }
}

export type OpportunityRouteRow = Awaited<
  ReturnType<OpportunityRouteRepository["getAll"]>
>[number];
