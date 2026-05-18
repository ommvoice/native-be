import type { OpportunityRecordType, Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityClubV2Repository } from "./repository.js";
import type { CreateOpportunityClubV2Body } from "./schema.js";
import type { OpportunityClubV2Response } from "./types.js";
import { enrichOpportunityClubV2Response } from "./helpers.js";

const OPTIONAL_OPPORTUNITY_CLUB_V2_CREATE_FIELDS = [
  "clubDescription",
  "clubFormat",
  "clubCommittment",
  "clubFrequency",
  "clubAddressLine1",
  "clubAddressLine2",
  "clubCityTown",
  "clubStateRegionProvince",
  "clubPostcode",
  "clubCountry",
  "latitude",
  "longitude",
  "clubRepeatSession",
  "clubDailyFixedSessionTotal",
  "clubDailyFixedSessionSchedule",
  "clubDailySchedule",
  "clubFixedDailyTimings",
  "clubDailyStartTime",
  "clubDailyEndTime",
  "clubMixedTimingsMondayStartTime",
  "clubMixedTimingsMondayEndTime",
  "clubMixedTimingsTuesdayStartTime",
  "clubMixedTimingsTuesdayEndTime",
  "clubMixedTimingsWednesdayStartTime",
  "clubMixedTimingsWednesdayEndTime",
  "clubMixedTimingsThursdayStartTime",
  "clubMixedTimingsThursdayEndTime",
  "clubMixedTimingsFridayStartTime",
  "clubMixedTimingsFridayEndTime",
  "clubMixedTimingsSaturdayStartTime",
  "clubMixedTimingsSaturdayEndTime",
  "clubMixedTimingsSundayStartTime",
  "clubMixedTimingsSundayEndTime",
  "clubMultiSessionMondaySessionTotal",
  "clubMultiSessionMondaySchedule",
  "clubMultiSessionTuesdaySessionTotal",
  "clubMultiSessionTuesdaySchedule",
  "clubMultiSessionWednesdaySessionTotal",
  "clubMultiSessionWednesdaySchedule",
  "clubMultiSessionThursdaySessionTotal",
  "clubMultiSessionThursdaySchedule",
  "clubMultiSessionFridaySessionTotal",
  "clubMultiSessionFridaySchedule",
  "clubMultiSessionSaturdaySessionTotal",
  "clubMultiSessionSaturdaySchedule",
  "clubMultiSessionSundaySessionTotal",
  "clubMultiSessionSundaySchedule",
  "clubMonthlySchedule",
  "clubFixedMonthOccurance",
  "clubMonthlyOccurance",
  "clubMonthlyFixedDates",
  "ticketingRequirement",
  "clubBookingProvision",
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
  "clubParkingProvision",
  "clubGeneralFacilities",
  "clubChildFacilities",
  "clubAdultFacilities",
  "clubAgeSuitabilityUnder1S",
  "clubAgeSuitability1To2Years",
  "clubAgeSuitability3To4Years",
  "clubAgeSuitability5To7Years",
  "clubAgeSuitability8To12Years",
  "clubAgeSuitabilityOver13Years",
  "clubAgeSuitabilityAdults",
  "clubActivityGroup",
  "clubPhysicalSetting",
  "clubSkillArea",
  "clubSkillAreaVariant",
  "clubAbilityLevel",
  "clubInterestTags",
  "clubSeasonalTag",
  "clubSeasonalHighlights",
  "clubAttractions",
  "clubExtraKit",
  "image",
] as const satisfies readonly (keyof Prisma.OpportunityClubV2UncheckedCreateInput)[];

function pickOptionalCreateFields(
  body: CreateOpportunityClubV2Body,
): Partial<Prisma.OpportunityClubV2UncheckedCreateInput> {
  const out: Partial<Prisma.OpportunityClubV2UncheckedCreateInput> = {};
  for (const key of OPTIONAL_OPPORTUNITY_CLUB_V2_CREATE_FIELDS) {
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

export class OpportunityClubV2Service {
  constructor(private repository: OpportunityClubV2Repository) {}

  async getAll(): Promise<OpportunityClubV2Response[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityClubV2Response);
  }

  async getById(id: string): Promise<OpportunityClubV2Response> {
    const row = await this.repository.getById(id);
    if (!row) throw new AppError(404, "Opportunity club (v2) not found");
    return enrichOpportunityClubV2Response(row);
  }

  async create(
    data: CreateOpportunityClubV2Body,
  ): Promise<OpportunityClubV2Response> {
    const recordType = (data.opportunityType ?? "club") as OpportunityRecordType;

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

    const prismaData: Prisma.OpportunityClubV2UncheckedCreateInput = {
      themeId: theme.id,
      themeVariantId: themeVariant.id,
      clubName: data.clubName.trim(),
      opportunityType: recordType,
      ...pickOptionalCreateFields(data),
    };

    const start = parseOptionalIsoDate(data.clubStartDate ?? undefined);
    if (start !== undefined) prismaData.clubStartDate = start;
    const end = parseOptionalIsoDate(data.clubEndDate ?? undefined);
    if (end !== undefined) prismaData.clubEndDate = end;

    const created = await this.repository.create(prismaData);
    return enrichOpportunityClubV2Response(created);
  }
}
