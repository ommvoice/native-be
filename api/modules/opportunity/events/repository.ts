import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import type { CreateOpportunityEventBody } from "./schema.js";

export class OpportunityEventRepository {
  async getAll() {
    return prisma.opportunityEvent.findMany();
  }

  async getById(id: string) {
    return prisma.opportunityEvent.findUnique({
      where: { id },
    });
  }

  async create(data: CreateOpportunityEventBody) {
    const {
      generalFacilitySlugs,
      kidsFacilitySlugs,
      parentFacilitySlugs,
      ageSuitabilitySlugs,
      extraKitSlugs,
      seasonalHighlightSlugs,
      highlightAttractionSlugs,
      startDate,
      endDate,
      ...scalars
    } = data;

    const prismaData: Prisma.OpportunityEventUncheckedCreateInput = {
      name: scalars.name,
      themeSlug: scalars.themeSlug,
      eventTypeSlug: scalars.eventTypeSlug,
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
    if (scalars.activityGroupSlug !== undefined) {
      prismaData.activityGroupSlug =
        scalars.activityGroupSlug === null || scalars.activityGroupSlug === ""
          ? null
          : scalars.activityGroupSlug;
    }
    if (startDate !== undefined && startDate !== null) {
      prismaData.startDate = new Date(startDate);
    }
    if (endDate !== undefined && endDate !== null) {
      prismaData.endDate = new Date(endDate);
    }
    if (scalars.startTime !== undefined) {
      prismaData.startTime = scalars.startTime;
    }
    if (scalars.finishTime !== undefined) {
      prismaData.finishTime = scalars.finishTime;
    }
    if (scalars.venuePostCode !== undefined) {
      prismaData.venuePostCode = scalars.venuePostCode;
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
    if (scalars.skillAreaSlug !== undefined) {
      prismaData.skillAreaSlug =
        scalars.skillAreaSlug === null || scalars.skillAreaSlug === ""
          ? null
          : scalars.skillAreaSlug;
    }
    if (scalars.skillAreaVariant !== undefined) {
      prismaData.skillAreaVariant = scalars.skillAreaVariant;
    }
    if (scalars.abilityLevelSlug !== undefined) {
      prismaData.abilityLevelSlug =
        scalars.abilityLevelSlug === null || scalars.abilityLevelSlug === ""
          ? null
          : scalars.abilityLevelSlug;
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
    if (generalFacilitySlugs !== undefined) {
      prismaData.generalFacilitySlugs = [...new Set(generalFacilitySlugs)];
    }
    if (kidsFacilitySlugs !== undefined) {
      prismaData.kidsFacilitySlugs = [...new Set(kidsFacilitySlugs)];
    }
    if (parentFacilitySlugs !== undefined) {
      prismaData.parentFacilitySlugs = [...new Set(parentFacilitySlugs)];
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

    return prisma.opportunityEvent.create({
      data: prismaData,
    });
  }
}

export type OpportunityEventWithRelations = Awaited<
  ReturnType<OpportunityEventRepository["getAll"]>
>[number];
