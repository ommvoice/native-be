import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import { enrichOpportunityVenueV2Response } from "./helpers.js";
import type { OpportunityVenueV2Response } from "./types.js";
import type { CreateOpportunityVenueV2Body } from "./schema.js";

export class OpportunityVenueV2Repository {
  async getAll(): Promise<OpportunityVenueV2Response[]> {
    const items = await scanAll(TABLES.opportunityEventsV2);
    return items.map(enrichOpportunityVenueV2Response);
  }

  async getById(id: string): Promise<OpportunityVenueV2Response | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityEventsV2, Key: { id } }));
    return res.Item ? enrichOpportunityVenueV2Response(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityVenueV2Body): Promise<OpportunityVenueV2Response> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      opportunityType: data.opportunityType ?? "event",
      themeSlug: data.themeSlug.trim(),
      themeVariantSlug: data.themeVariantSlug.trim(),
      eventName: data.eventName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const set = (k: string, v: unknown) => {
      if (v !== undefined) item[k] = v;
    };

    set("eventActivityGroup", data.eventActivityGroup);
    set("eventType", data.eventType);
    set("eventDescription", data.eventDescription);
    set("eventAddressLine1", data.eventAddressLine1);
    set("eventAddressLine2", data.eventAddressLine2);
    set("eventCity", data.eventCity);
    set("eventRegion", data.eventRegion);
    set("eventPostcode", data.eventPostcode);
    set("eventCountry", data.eventCountry);
    set("latitude", data.latitude);
    set("longitude", data.longitude);
    set("eventPhysicalSetting", data.eventPhysicalSetting);
    set("eventDetailedWeatherSuitability", data.eventDetailedWeatherSuitability);
    if (data.eventStartDate !== undefined) {
      item.eventStartDate = data.eventStartDate ? new Date(data.eventStartDate).toISOString() : null;
    }
    if (data.eventEndDate !== undefined) {
      item.eventEndDate = data.eventEndDate ? new Date(data.eventEndDate).toISOString() : null;
    }
    if (data.ticketSalesStartDate !== undefined) {
      item.ticketSalesStartDate = data.ticketSalesStartDate
        ? new Date(data.ticketSalesStartDate).toISOString()
        : null;
    }
    set("eventDaysTotal", data.eventDaysTotal);
    set("eventDailyMultiSession", data.eventDailyMultiSession);
    set("eventTimetableWeekly", data.eventTimetableWeekly);
    set("eventDailyFixedTimings", data.eventDailyFixedTimings);
    set("eventDailyFixedStartTime", data.eventDailyFixedStartTime);
    set("eventDailyFixedEndTime", data.eventDailyFixedEndTime);
    set("eventDailyMultiSessionTotal", data.eventDailyMultiSessionTotal);
    set("eventDailyMultiSessionTimings", data.eventDailyMultiSessionTimings);
    set("eventWeeklyFixedStartTime", data.eventWeeklyFixedStartTime);
    set("eventWeeklyFixedEndTime", data.eventWeeklyFixedEndTime);
    set("eventMixedTimingsMondayStart", data.eventMixedTimingsMondayStart);
    set("eventMixedTimingsMondayEnd", data.eventMixedTimingsMondayEnd);
    set("eventMixedTimingsTuesdayStart", data.eventMixedTimingsTuesdayStart);
    set("eventMixedTimingsTuesdayEnd", data.eventMixedTimingsTuesdayEnd);
    set("eventMixedTimingsWednesdayStart", data.eventMixedTimingsWednesdayStart);
    set("eventMixedTimingsWednesdayEnd", data.eventMixedTimingsWednesdayEnd);
    set("eventMixedTimingsThursdayStart", data.eventMixedTimingsThursdayStart);
    set("eventMixedTimingsThursdayEnd", data.eventMixedTimingsThursdayEnd);
    set("eventMixedTimingsFridayStart", data.eventMixedTimingsFridayStart);
    set("eventMixedTimingsFridayEnd", data.eventMixedTimingsFridayEnd);
    set("eventMixedTimingsSaturdayStart", data.eventMixedTimingsSaturdayStart);
    set("eventMixedTimingsSaturdayEnd", data.eventMixedTimingsSaturdayEnd);
    set("eventMixedTimingsSundayStart", data.eventMixedTimingsSundayStart);
    set("eventMixedTimingsSundayEnd", data.eventMixedTimingsSundayEnd);
    set("eventEntryCost", data.eventEntryCost);
    set("ticketingRequirement", data.ticketingRequirement);
    set("eventBookingType", data.eventBookingType);
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
    set("eventParkingProvision", data.eventParkingProvision);
    set("eventGeneralFacilities", data.eventGeneralFacilities);
    set("eventChildFacilities", data.eventChildFacilities);
    set("eventAdultFacilities", data.eventAdultFacilities);
    set("eventAgeSuitabilityUnder1S", data.eventAgeSuitabilityUnder1S);
    set("eventAgeSuitability1To2Years", data.eventAgeSuitability1To2Years);
    set("eventAgeSuitability3To4Years", data.eventAgeSuitability3To4Years);
    set("eventAgeSuitability5To7Years", data.eventAgeSuitability5To7Years);
    set("eventAgeSuitability8To12Years", data.eventAgeSuitability8To12Years);
    set("eventAgeSuitabilityOver13Years", data.eventAgeSuitabilityOver13Years);
    set("eventAgeSuitabilityAdults", data.eventAgeSuitabilityAdults);
    set("eventInterestTags", data.eventInterestTags);
    set("eventSeasonalTags", data.eventSeasonalTags);
    set("eventSeasonalHighlights", data.eventSeasonalHighlights);
    set("eventHighlights", data.eventHighlights);
    set("eventExtraKit", data.eventExtraKit);
    set("eventSkillArea", data.eventSkillArea);
    set("eventSkillAreaVariant", data.eventSkillAreaVariant);
    set("eventAbilityLevel", data.eventAbilityLevel);
    set("image", data.image);

    await db.send(new PutCommand({ TableName: TABLES.opportunityEventsV2, Item: item }));
    return enrichOpportunityVenueV2Response(item);
  }
}
