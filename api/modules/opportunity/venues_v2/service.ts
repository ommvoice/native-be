import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityVenuesV2Repository } from "./repository.js";
import type { CreateOpportunityVenuesV2Body } from "./schema.js";
import type { OpportunityVenuesV2Response } from "./types.js";
import { enrichOpportunityVenuesV2Response } from "./helpers.js";

/** Optional scalar columns copied onto Prisma create input (theme resolved separately). */
const OPTIONAL_VENUES_V2_CREATE_FIELDS = [
  "venueActivityGroup",
  "venueDescription",
  "venueAddressLine1",
  "venueAddressLine2",
  "venueCity",
  "venueRegion",
  "venuePostcode",
  "latitude",
  "longitude",
  "venueCountry",
  "venueSchedulePattern",
  "venueFixedDailyTimings",
  "venueFixedTimingsStartTime",
  "venueFixedTimingsEndTime",
  "venueMixedTimingsMondayStart",
  "venueMixedTimingsMondayEnd",
  "venueMixedTimingsTuesdayStart",
  "venueMixedTimingsTuesdayEnd",
  "venueMixedTimingsWednesdayStart",
  "venueMixedTimingsWednesdayEnd",
  "venueMixedTimingsThursdayStart",
  "venueMixedTimingsThursdayEnd",
  "venueMixedTimingsFridayStart",
  "venueMixedTimingsFridayEnd",
  "venueMixedTimingsSaturdayStart",
  "venueMixedTimingsSaturdayEnd",
  "venueMixedTimingsSundayStart",
  "venueMixedTimingsSundayEnd",
  "venueEntryCost",
  "ticketingRequirement",
  "venueBookingType",
  "ticketingVariants",
  "ticketVariantDefinitionBaby",
  "ticketVariantBabyPrice",
  "ticketVariantDefinitionFixedChild",
  "ticketVariantFixedChildPrice",
  "ticketVariantDefinitionYoungChild",
  "ticketVariantYoungChildPrice",
  "ticketVariantDefinitionOlderChild",
  "ticketVariantOlderChildPrice",
  "ticketVariantDefinitionAdult",
  "ticketVariantAdultPrice",
  "ticketVariantDefinitionConcession",
  "ticketVariantConcessionPrice",
  "ticketVariantDefinitionGroup",
  "ticketVariantGroupPrice",
  "venueGeneralFacilities",
  "venueChildFacilities",
  "venueAdultFacilities",
  "venueDogFacilities",
  "venueParkingProvision",
  "venueAgeSuitabilityUnder1Years",
  "venueAgeSuitability1To2Years",
  "venueAgeSuitability3To4Years",
  "venueAgeSuitability5To7Years",
  "venueAgeSuitability8To12Years",
  "venueAgeSuitabilityOver13Years",
  "venueAgeSuitabilityAdults",
  "venuePhysicalSetting",
  "venueDetailedWeatherSuitability",
  "venueEstimatedDuration",
  "venueInterestTags",
  "venueSeasonalTag",
  "venueSeasonalHighlights",
  "venueAttractions",
  "venueExtraKit",
  "image",
] as const satisfies readonly (keyof Prisma.OpportunityVenuesV2UncheckedCreateInput)[];

function pickOptionalCreateFields(
  body: CreateOpportunityVenuesV2Body,
): Partial<Prisma.OpportunityVenuesV2UncheckedCreateInput> {
  const out: Partial<Prisma.OpportunityVenuesV2UncheckedCreateInput> = {};
  for (const key of OPTIONAL_VENUES_V2_CREATE_FIELDS) {
    const v = body[key];
    if (v !== undefined) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}

export class OpportunityVenuesV2Service {
  constructor(private repository: OpportunityVenuesV2Repository) {}

  async getAll(): Promise<OpportunityVenuesV2Response[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityVenuesV2Response);
  }

  async getById(id: string): Promise<OpportunityVenuesV2Response> {
    const row = await this.repository.getById(id);
    if (!row) {
      throw new AppError(404, "Opportunity venue (v2) not found");
    }
    return enrichOpportunityVenuesV2Response(row);
  }

  async create(data: CreateOpportunityVenuesV2Body): Promise<OpportunityVenuesV2Response> {
    const recordType = "venue" as const;

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

    const prismaData: Prisma.OpportunityVenuesV2UncheckedCreateInput = {
      themeId: theme.id,
      themeVariantId: themeVariant.id,
      venueName: data.venueName.trim(),
      ...pickOptionalCreateFields(data),
      opportunityType: "venue",
    };

    const created = await this.repository.create(prismaData);
    return enrichOpportunityVenuesV2Response(created);
  }
}
