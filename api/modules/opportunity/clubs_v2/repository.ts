import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import { enrichOpportunityClubV2Response } from "./helpers.js";
import type { OpportunityClubV2Response } from "./types.js";
import type { CreateOpportunityClubV2Body } from "./schema.js";

export class OpportunityClubV2Repository {
  async getAll(): Promise<OpportunityClubV2Response[]> {
    const items = await scanAll(TABLES.opportunityClubsV2);
    return items.map(enrichOpportunityClubV2Response);
  }

  async getById(id: string): Promise<OpportunityClubV2Response | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityClubsV2, Key: { id } }));
    return res.Item ? enrichOpportunityClubV2Response(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityClubV2Body): Promise<OpportunityClubV2Response> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      opportunityType: data.opportunityType ?? "club",
      themeSlug: data.themeSlug.trim(),
      themeVariantSlug: data.themeVariantSlug.trim(),
      clubName: data.clubName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const set = (k: string, v: unknown) => {
      if (v !== undefined) item[k] = v;
    };

    set("clubDescription", data.clubDescription);
    set("clubFormat", data.clubFormat);
    set("clubCommittment", data.clubCommittment);
    set("clubFrequency", data.clubFrequency);
    set("clubAddressLine1", data.clubAddressLine1);
    set("clubAddressLine2", data.clubAddressLine2);
    set("clubCityTown", data.clubCityTown);
    set("clubStateRegionProvince", data.clubStateRegionProvince);
    set("clubPostcode", data.clubPostcode);
    set("clubCountry", data.clubCountry);
    set("latitude", data.latitude);
    set("longitude", data.longitude);
    if (data.clubStartDate !== undefined) {
      item.clubStartDate = data.clubStartDate ? new Date(data.clubStartDate).toISOString() : null;
    }
    if (data.clubEndDate !== undefined) {
      item.clubEndDate = data.clubEndDate ? new Date(data.clubEndDate).toISOString() : null;
    }
    set("clubRepeatSession", data.clubRepeatSession);
    set("clubDailyFixedSessionTotal", data.clubDailyFixedSessionTotal);
    set("clubDailyFixedSessionSchedule", data.clubDailyFixedSessionSchedule);
    set("clubDailySchedule", data.clubDailySchedule);
    set("clubFixedDailyTimings", data.clubFixedDailyTimings);
    set("clubDailyStartTime", data.clubDailyStartTime);
    set("clubDailyEndTime", data.clubDailyEndTime);
    set("clubMixedTimingsMondayStartTime", data.clubMixedTimingsMondayStartTime);
    set("clubMixedTimingsMondayEndTime", data.clubMixedTimingsMondayEndTime);
    set("clubMixedTimingsTuesdayStartTime", data.clubMixedTimingsTuesdayStartTime);
    set("clubMixedTimingsTuesdayEndTime", data.clubMixedTimingsTuesdayEndTime);
    set("clubMixedTimingsWednesdayStartTime", data.clubMixedTimingsWednesdayStartTime);
    set("clubMixedTimingsWednesdayEndTime", data.clubMixedTimingsWednesdayEndTime);
    set("clubMixedTimingsThursdayStartTime", data.clubMixedTimingsThursdayStartTime);
    set("clubMixedTimingsThursdayEndTime", data.clubMixedTimingsThursdayEndTime);
    set("clubMixedTimingsFridayStartTime", data.clubMixedTimingsFridayStartTime);
    set("clubMixedTimingsFridayEndTime", data.clubMixedTimingsFridayEndTime);
    set("clubMixedTimingsSaturdayStartTime", data.clubMixedTimingsSaturdayStartTime);
    set("clubMixedTimingsSaturdayEndTime", data.clubMixedTimingsSaturdayEndTime);
    set("clubMixedTimingsSundayStartTime", data.clubMixedTimingsSundayStartTime);
    set("clubMixedTimingsSundayEndTime", data.clubMixedTimingsSundayEndTime);
    set("clubMultiSessionMondaySessionTotal", data.clubMultiSessionMondaySessionTotal);
    set("clubMultiSessionMondaySchedule", data.clubMultiSessionMondaySchedule);
    set("clubMultiSessionTuesdaySessionTotal", data.clubMultiSessionTuesdaySessionTotal);
    set("clubMultiSessionTuesdaySchedule", data.clubMultiSessionTuesdaySchedule);
    set("clubMultiSessionWednesdaySessionTotal", data.clubMultiSessionWednesdaySessionTotal);
    set("clubMultiSessionWednesdaySchedule", data.clubMultiSessionWednesdaySchedule);
    set("clubMultiSessionThursdaySessionTotal", data.clubMultiSessionThursdaySessionTotal);
    set("clubMultiSessionThursdaySchedule", data.clubMultiSessionThursdaySchedule);
    set("clubMultiSessionFridaySessionTotal", data.clubMultiSessionFridaySessionTotal);
    set("clubMultiSessionFridaySchedule", data.clubMultiSessionFridaySchedule);
    set("clubMultiSessionSaturdaySessionTotal", data.clubMultiSessionSaturdaySessionTotal);
    set("clubMultiSessionSaturdaySchedule", data.clubMultiSessionSaturdaySchedule);
    set("clubMultiSessionSundaySessionTotal", data.clubMultiSessionSundaySessionTotal);
    set("clubMultiSessionSundaySchedule", data.clubMultiSessionSundaySchedule);
    set("clubMonthlySchedule", data.clubMonthlySchedule);
    set("clubFixedMonthOccurance", data.clubFixedMonthOccurance);
    set("clubMonthlyOccurance", data.clubMonthlyOccurance);
    set("clubMonthlyFixedDates", data.clubMonthlyFixedDates);
    set("ticketingRequirement", data.ticketingRequirement);
    set("clubBookingProvision", data.clubBookingProvision);
    set("ticketingVariants", data.ticketingVariants);
    set("ticketVariantDefinitionBaby", data.ticketVariantDefinitionBaby);
    set("ticketVariantBabyPrice", data.ticketVariantBabyPrice);
    set("ticketVariantDefinitionFixedChild", data.ticketVariantDefinitionFixedChild);
    set("ticketVariantFixedChildPrice", data.ticketVariantFixedChildPrice);
    set("ticketVariantDefinitionYoungChild", data.ticketVariantDefinitionYoungChild);
    set("ticketVariantYoungChildPrice", data.ticketVariantYoungChildPrice);
    set("ticketVariantDefinitionOlderChild", data.ticketVariantDefinitionOlderChild);
    set("ticketVariantOlderChildPrice", data.ticketVariantOlderChildPrice);
    set("ticketVariantDefinitionAdult", data.ticketVariantDefinitionAdult);
    set("ticketVariantAdultPrice", data.ticketVariantAdultPrice);
    set("ticketVariantDefinitionConcession", data.ticketVariantDefinitionConcession);
    set("ticketVariantConcessionPrice", data.ticketVariantConcessionPrice);
    set("ticketVariantDefinitionGroup", data.ticketVariantDefinitionGroup);
    set("ticketVariantGroupPrice", data.ticketVariantGroupPrice);
    set("clubParkingProvision", data.clubParkingProvision);
    set("clubGeneralFacilities", data.clubGeneralFacilities);
    set("clubChildFacilities", data.clubChildFacilities);
    set("clubAdultFacilities", data.clubAdultFacilities);
    set("clubAgeSuitabilityUnder1S", data.clubAgeSuitabilityUnder1S);
    set("clubAgeSuitability1To2Years", data.clubAgeSuitability1To2Years);
    set("clubAgeSuitability3To4Years", data.clubAgeSuitability3To4Years);
    set("clubAgeSuitability5To7Years", data.clubAgeSuitability5To7Years);
    set("clubAgeSuitability8To12Years", data.clubAgeSuitability8To12Years);
    set("clubAgeSuitabilityOver13Years", data.clubAgeSuitabilityOver13Years);
    set("clubAgeSuitabilityAdults", data.clubAgeSuitabilityAdults);
    set("clubActivityGroup", data.clubActivityGroup);
    set("clubPhysicalSetting", data.clubPhysicalSetting);
    set("clubSkillArea", data.clubSkillArea);
    set("clubSkillAreaVariant", data.clubSkillAreaVariant);
    set("clubAbilityLevel", data.clubAbilityLevel);
    set("clubInterestTags", data.clubInterestTags);
    set("clubSeasonalTag", data.clubSeasonalTag);
    set("clubSeasonalHighlights", data.clubSeasonalHighlights);
    set("clubAttractions", data.clubAttractions);
    set("clubExtraKit", data.clubExtraKit);
    set("image", data.image);

    await db.send(new PutCommand({ TableName: TABLES.opportunityClubsV2, Item: item }));
    return enrichOpportunityClubV2Response(item);
  }
}
