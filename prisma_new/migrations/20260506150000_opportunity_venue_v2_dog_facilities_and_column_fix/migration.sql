-- Rename fixed-child definition column to match source spreadsheet (double underscore).
ALTER TABLE "opportunity_venue_v2" RENAME COLUMN "ticket_variant_definition_fixed_child" TO "ticket_variant_definition__fixed_child";

-- Align age suitability columns with latest import spec (grandparents removed).
ALTER TABLE "opportunity_venue_v2" DROP COLUMN "venue_age_suitability_grandparents";

-- Dog facilities column between adult facilities and age suitability.
ALTER TABLE "opportunity_venue_v2" ADD COLUMN "venue_dog_facilities" TEXT;
