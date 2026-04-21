import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import type { CreateOpportunityVenueBody } from "./schema.js";

export class OpportunityVenueRepository {
  async getAll() {
    return prisma.opportunityVenue.findMany();
  }

  async getById(id: string) {
    return prisma.opportunityVenue.findUnique({
      where: { id },
    });
  }

  async create(data: CreateOpportunityVenueBody) {
    const {
      generalFacilitySlugs,
      kidsFacilitySlugs,
      parentFacilitySlugs,
      dogFacilitySlugs,
      ageSuitabilitySlugs,
      extraKitSlugs,
      seasonalHighlightSlugs,
      highlightAttractionSlugs,
      venuePostCode,
      ...scalars
    } = data;

    const prismaData: Prisma.OpportunityVenueUncheckedCreateInput = {
      name: scalars.name,
      themeSlug: scalars.themeSlug,
    };

    if (scalars.description !== undefined) {
      prismaData.description = scalars.description;
    }
    if (venuePostCode !== undefined) {
      prismaData.venuePostcode = venuePostCode;
    }
    if (scalars.openingDaysAndTimes !== undefined) {
      prismaData.openingDaysAndTimes = scalars.openingDaysAndTimes;
    }
    if (scalars.openingExclusions !== undefined) {
      prismaData.openingExclusions = scalars.openingExclusions;
    }
    if (scalars.themeVariantSlug !== undefined) {
      prismaData.themeVariantSlug =
        scalars.themeVariantSlug === null || scalars.themeVariantSlug === ""
          ? null
          : scalars.themeVariantSlug;
    }
    if (scalars.activityGroupSlug !== undefined) {
      prismaData.activityGroupSlug =
        scalars.activityGroupSlug === null || scalars.activityGroupSlug === ""
          ? null
          : scalars.activityGroupSlug;
    }
    if (scalars.terrainTypeSlug !== undefined) {
      prismaData.terrainTypeSlug =
        scalars.terrainTypeSlug === null || scalars.terrainTypeSlug === ""
          ? null
          : scalars.terrainTypeSlug;
    }
    if (scalars.venueSettingSlug !== undefined) {
      prismaData.venueSettingSlug =
        scalars.venueSettingSlug === null || scalars.venueSettingSlug === ""
          ? null
          : scalars.venueSettingSlug;
    }
    if (scalars.parkingProvisionSlug !== undefined) {
      prismaData.parkingProvisionSlug =
        scalars.parkingProvisionSlug === null ||
        scalars.parkingProvisionSlug === ""
          ? null
          : scalars.parkingProvisionSlug;
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
    if (scalars.estimatedTimeToSpend !== undefined) {
      prismaData.estimatedTimeToSpend = scalars.estimatedTimeToSpend;
    }
    if (scalars.seasonalTagSlug !== undefined) {
      prismaData.seasonalTagSlug =
        scalars.seasonalTagSlug === null || scalars.seasonalTagSlug === ""
          ? null
          : scalars.seasonalTagSlug;
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
    if (ageSuitabilitySlugs !== undefined) {
      prismaData.ageSuitabilitySlugs = [...new Set(ageSuitabilitySlugs)];
    }
    if (extraKitSlugs !== undefined) {
      prismaData.extraKitSlugs = [...new Set(extraKitSlugs)];
    }
    if (seasonalHighlightSlugs !== undefined) {
      prismaData.seasonalHighlightSlugs = [...new Set(seasonalHighlightSlugs)];
    }
    if (highlightAttractionSlugs !== undefined) {
      prismaData.highlightAttractionSlugs = [
        ...new Set(highlightAttractionSlugs),
      ];
    }

    return prisma.opportunityVenue.create({
      data: prismaData,
    });
  }
}

export type OpportunityVenueRow = Awaited<
  ReturnType<OpportunityVenueRepository["getAll"]>
>[number];
