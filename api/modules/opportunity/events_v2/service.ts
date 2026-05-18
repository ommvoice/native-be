import type { OpportunityRecordType, Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityVenueV2Repository } from "./repository.js";
import type { CreateOpportunityVenueV2Body } from "./schema.js";
import type { OpportunityVenueV2Response } from "./types.js";
import { enrichOpportunityVenueV2Response } from "./helpers.js";

const OPTIONAL_OPPORTUNITY_VENUE_V2_CREATE_FIELDS = [
  "eventActivityGroup",
  "eventType",
  "eventDescription",
  "eventAddressLine1",
  "eventAddressLine2",
  "eventCity",
  "eventRegion",
  "eventPostcode",
  "eventCountry",
  "latitude",
  "longitude",
  "eventPhysicalSetting",
  "eventDetailedWeatherSuitability",
  "eventDaysTotal",
  "eventDailyMultiSession",
  "eventTimetableWeekly",
  "eventDailyFixedTimings",
  "eventDailyFixedStartTime",
  "eventDailyFixedEndTime",
  "eventDailyMultiSessionTotal",
  "eventDailyMultiSessionTimings",
  "eventWeeklyFixedStartTime",
  "eventWeeklyFixedEndTime",
  "eventMixedTimingsMondayStart",
  "eventMixedTimingsMondayEnd",
  "eventMixedTimingsTuesdayStart",
  "eventMixedTimingsTuesdayEnd",
  "eventMixedTimingsWednesdayStart",
  "eventMixedTimingsWednesdayEnd",
  "eventMixedTimingsThursdayStart",
  "eventMixedTimingsThursdayEnd",
  "eventMixedTimingsFridayStart",
  "eventMixedTimingsFridayEnd",
  "eventMixedTimingsSaturdayStart",
  "eventMixedTimingsSaturdayEnd",
  "eventMixedTimingsSundayStart",
  "eventMixedTimingsSundayEnd",
  "eventEntryCost",
  "ticketingRequirement",
  "eventBookingType",
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
  "eventParkingProvision",
  "eventGeneralFacilities",
  "eventChildFacilities",
  "eventAdultFacilities",
  "eventAgeSuitabilityUnder1S",
  "eventAgeSuitability1To2Years",
  "eventAgeSuitability3To4Years",
  "eventAgeSuitability5To7Years",
  "eventAgeSuitability8To12Years",
  "eventAgeSuitabilityOver13Years",
  "eventAgeSuitabilityAdults",
  "eventInterestTags",
  "eventSeasonalTags",
  "eventSeasonalHighlights",
  "eventHighlights",
  "eventExtraKit",
  "eventSkillArea",
  "eventSkillAreaVariant",
  "eventAbilityLevel",
  "image",
] as const satisfies readonly (keyof Prisma.OpportunityEventsV2UncheckedCreateInput)[];

function pickOptionalCreateFields(
  body: CreateOpportunityVenueV2Body,
): Partial<Prisma.OpportunityEventsV2UncheckedCreateInput> {
  const out: Partial<Prisma.OpportunityEventsV2UncheckedCreateInput> = {};
  for (const key of OPTIONAL_OPPORTUNITY_VENUE_V2_CREATE_FIELDS) {
    const v = body[key];
    if (v !== undefined) {
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}

function parseOptionalIsoDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return new Date(value);
}

export class OpportunityVenueV2Service {
  constructor(private repository: OpportunityVenueV2Repository) {}

  async getAll(): Promise<OpportunityVenueV2Response[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityVenueV2Response);
  }

  async getById(id: string): Promise<OpportunityVenueV2Response> {
    const row = await this.repository.getById(id);
    if (!row) {
      throw new AppError(404, "Opportunity venue (v2 event import) not found");
    }
    return enrichOpportunityVenueV2Response(row);
  }

  async create(
    data: CreateOpportunityVenueV2Body,
  ): Promise<OpportunityVenueV2Response> {
    const recordType = (data.opportunityType ?? "event") as OpportunityRecordType;

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

    const prismaData: Prisma.OpportunityEventsV2UncheckedCreateInput = {
      themeId: theme.id,
      themeVariantId: themeVariant.id,
      eventName: data.eventName.trim(),
      opportunityType: recordType,
      ...pickOptionalCreateFields(data),
    };

    const start = parseOptionalIsoDate(data.eventStartDate ?? undefined);
    if (start !== undefined) prismaData.eventStartDate = start;
    const end = parseOptionalIsoDate(data.eventEndDate ?? undefined);
    if (end !== undefined) prismaData.eventEndDate = end;
    const ticketSales = parseOptionalIsoDate(
      data.ticketSalesStartDate ?? undefined,
    );
    if (ticketSales !== undefined) prismaData.ticketSalesStartDate = ticketSales;

    const created = await this.repository.create(prismaData);
    return enrichOpportunityVenueV2Response(created);
  }
}
