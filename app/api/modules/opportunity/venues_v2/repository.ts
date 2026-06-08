import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../../database/database.config.js";
import { TABLES } from "../../../database/tables.js";
import { scanAll } from "../../../database/dynamo-helpers.js";
import { enrichOpportunityVenuesV2Response } from "./helpers.js";
import type { OpportunityVenuesV2Response } from "./types.js";
import type { CreateOpportunityVenuesV2Body } from "./schema.js";

export class OpportunityVenuesV2Repository {
  async getAll(): Promise<OpportunityVenuesV2Response[]> {
    const items = await scanAll(TABLES.opportunityVenuesV2);
    return items.map(enrichOpportunityVenuesV2Response);
  }

  async getById(id: string): Promise<OpportunityVenuesV2Response | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityVenuesV2, Key: { id } }));
    return res.Item ? enrichOpportunityVenuesV2Response(res.Item as Record<string, unknown>) : null;
  }

  async create(data: CreateOpportunityVenuesV2Body): Promise<OpportunityVenuesV2Response> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: Record<string, unknown> = {
      id,
      opportunityType: "venue",
      themeSlug: data.themeSlug.trim(),
      themeVariantSlug: data.themeVariantSlug.trim(),
      venueName: data.venueName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const set = (k: string, v: unknown) => {
      if (v !== undefined) item[k] = v;
    };

    set("venueActivityGroup", data.venueActivityGroup);
    set("venueDescription", data.venueDescription);
    set("venueAddressLine1", data.venueAddressLine1);
    set("venueAddressLine2", data.venueAddressLine2);
    set("venueCity", data.venueCity);
    set("venueRegion", data.venueRegion);
    set("venuePostcode", data.venuePostcode);
    set("latitude", data.latitude);
    set("longitude", data.longitude);
    set("venueCountry", data.venueCountry);
    set("venueSchedulePattern", data.venueSchedulePattern);
    set("venueFixedDailyTimings", data.venueFixedDailyTimings);
    set("venueFixedTimingsStartTime", data.venueFixedTimingsStartTime);
    set("venueFixedTimingsEndTime", data.venueFixedTimingsEndTime);
    set("venueMixedTimingsMondayStart", data.venueMixedTimingsMondayStart);
    set("venueMixedTimingsMondayEnd", data.venueMixedTimingsMondayEnd);
    set("venueMixedTimingsTuesdayStart", data.venueMixedTimingsTuesdayStart);
    set("venueMixedTimingsTuesdayEnd", data.venueMixedTimingsTuesdayEnd);
    set("venueMixedTimingsWednesdayStart", data.venueMixedTimingsWednesdayStart);
    set("venueMixedTimingsWednesdayEnd", data.venueMixedTimingsWednesdayEnd);
    set("venueMixedTimingsThursdayStart", data.venueMixedTimingsThursdayStart);
    set("venueMixedTimingsThursdayEnd", data.venueMixedTimingsThursdayEnd);
    set("venueMixedTimingsFridayStart", data.venueMixedTimingsFridayStart);
    set("venueMixedTimingsFridayEnd", data.venueMixedTimingsFridayEnd);
    set("venueMixedTimingsSaturdayStart", data.venueMixedTimingsSaturdayStart);
    set("venueMixedTimingsSaturdayEnd", data.venueMixedTimingsSaturdayEnd);
    set("venueMixedTimingsSundayStart", data.venueMixedTimingsSundayStart);
    set("venueMixedTimingsSundayEnd", data.venueMixedTimingsSundayEnd);
    set("venueEntryCost", data.venueEntryCost);
    set("ticketingRequirement", data.ticketingRequirement);
    set("venueBookingType", data.venueBookingType);
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
    set("venueGeneralFacilities", data.venueGeneralFacilities);
    set("venueChildFacilities", data.venueChildFacilities);
    set("venueAdultFacilities", data.venueAdultFacilities);
    set("venueDogFacilities", data.venueDogFacilities);
    set("venueParkingProvision", data.venueParkingProvision);
    set("venueAgeSuitabilityUnder1Years", data.venueAgeSuitabilityUnder1Years);
    set("venueAgeSuitability1To2Years", data.venueAgeSuitability1To2Years);
    set("venueAgeSuitability3To4Years", data.venueAgeSuitability3To4Years);
    set("venueAgeSuitability5To7Years", data.venueAgeSuitability5To7Years);
    set("venueAgeSuitability8To12Years", data.venueAgeSuitability8To12Years);
    set("venueAgeSuitabilityOver13Years", data.venueAgeSuitabilityOver13Years);
    set("venueAgeSuitabilityAdults", data.venueAgeSuitabilityAdults);
    set("venuePhysicalSetting", data.venuePhysicalSetting);
    set("venueDetailedWeatherSuitability", data.venueDetailedWeatherSuitability);
    set("venueEstimatedDuration", data.venueEstimatedDuration);
    set("venueInterestTags", data.venueInterestTags);
    set("venueSeasonalTag", data.venueSeasonalTag);
    set("venueSeasonalHighlights", data.venueSeasonalHighlights);
    set("venueAttractions", data.venueAttractions);
    set("venueExtraKit", data.venueExtraKit);
    set("image", data.image);

    await db.send(new PutCommand({ TableName: TABLES.opportunityVenuesV2, Item: item }));
    return enrichOpportunityVenuesV2Response(item);
  }
}
