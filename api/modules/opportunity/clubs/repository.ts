import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import type { CreateOpportunityClubBody } from "./schema.js";

export class OpportunityClubRepository {
  async getAll() {
    return prisma.opportunityClub.findMany();
  }

  async getById(id: string) {
    return prisma.opportunityClub.findUnique({
      where: { id },
    });
  }

  async create(data: CreateOpportunityClubBody) {
    const {
      generalFacilitySlugs,
      kidsFacilitySlugs,
      parentFacilitySlugs,
      ageSuitabilitySlugs,
      extraKitSlugs,
      seasonalHighlightSlugs,
      highlightAttractionSlugs,
      ...scalars
    } = data;

    const prismaData: Prisma.OpportunityClubUncheckedCreateInput = {
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
    if (scalars.venuePostCode !== undefined) {
      prismaData.venuePostCode = scalars.venuePostCode;
    }
    if (scalars.startTime !== undefined) {
      prismaData.startTime = scalars.startTime;
    }
    if (scalars.finishTime !== undefined) {
      prismaData.finishTime = scalars.finishTime;
    }
    if (scalars.dayOfWeekSlug !== undefined) {
      prismaData.dayOfWeekSlug =
        scalars.dayOfWeekSlug === null || scalars.dayOfWeekSlug === ""
          ? null
          : scalars.dayOfWeekSlug;
    }
    if (scalars.activityGroupSlug !== undefined) {
      prismaData.activityGroupSlug =
        scalars.activityGroupSlug === null || scalars.activityGroupSlug === ""
          ? null
          : scalars.activityGroupSlug;
    }
    if (scalars.clubFormatSlug !== undefined) {
      prismaData.clubFormatSlug =
        scalars.clubFormatSlug === null || scalars.clubFormatSlug === ""
          ? null
          : scalars.clubFormatSlug;
    }
    if (scalars.clubFrequencySlug !== undefined) {
      prismaData.clubFrequencySlug =
        scalars.clubFrequencySlug === null || scalars.clubFrequencySlug === ""
          ? null
          : scalars.clubFrequencySlug;
    }
    if (scalars.commitmentSlug !== undefined) {
      prismaData.commitmentSlug =
        scalars.commitmentSlug === null || scalars.commitmentSlug === ""
          ? null
          : scalars.commitmentSlug;
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

    return prisma.opportunityClub.create({
      data: prismaData,
    });
  }
}

export type OpportunityClubRow = Awaited<
  ReturnType<OpportunityClubRepository["getAll"]>
>[number];
