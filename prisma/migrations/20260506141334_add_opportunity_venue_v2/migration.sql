-- CreateTable
CREATE TABLE "opportunity_venue_v2" (
    "id" TEXT NOT NULL,
    "opportunity_type" "OpportunityRecordType" NOT NULL DEFAULT 'venue',
    "venue_opportunity_theme_id" TEXT NOT NULL,
    "venue_opportunity_theme_variant_id" TEXT NOT NULL,
    "venue_name" TEXT NOT NULL,
    "venue_activity_group" TEXT,
    "venue_description" TEXT,
    "venue_address_line_1" TEXT,
    "venue_address_line_2" TEXT,
    "venue_city" TEXT,
    "venue_region" TEXT,
    "venue_postcode" VARCHAR(20),
    "latitude" TEXT,
    "longitude" TEXT,
    "venue_country" TEXT,
    "venue_schedule_pattern" TEXT,
    "venue_fixed_daily_timings" BOOLEAN,
    "venue_fixed_timings_start_time" VARCHAR(5),
    "venue_fixed_timings_end_time" VARCHAR(5),
    "venue_mixed_timings_monday_start_time" VARCHAR(5),
    "venue_mixed_timings_monday_end_time" VARCHAR(5),
    "venue_mixed_timings_tuesday_start_time" VARCHAR(5),
    "venue_mixed_timings_tuesday_end_time" VARCHAR(5),
    "venue_mixed_timings_wednesday_start_time" VARCHAR(5),
    "venue_mixed_timings_wednesday_end_time" VARCHAR(5),
    "venue_mixed_timings_thursday_start_time" VARCHAR(5),
    "venue_mixed_timings_thursday_end_time" VARCHAR(5),
    "venue_mixed_timings_friday_start_time" VARCHAR(5),
    "venue_mixed_timings_friday_end_time" VARCHAR(5),
    "venue_mixed_timings_saturday_start_time" VARCHAR(5),
    "venue_mixed_timings_saturday_end_time" VARCHAR(5),
    "venue_mixed_timings_sunday_start_time" VARCHAR(5),
    "venue_mixed_timings_sunday_end_time" VARCHAR(5),
    "venue_entry_cost" BOOLEAN,
    "ticketing_requirement" BOOLEAN,
    "venue_booking_type" TEXT,
    "ticketing_variants" TEXT,
    "ticket_variant_definition_baby" TEXT,
    "ticket_variant_baby_price" TEXT,
    "ticket_variant_definition_fixed_child" TEXT,
    "ticket_variant_fixed_child_price" TEXT,
    "ticket_variant_definition_young_child" TEXT,
    "ticket_variant_young_child_price" TEXT,
    "ticket_variant_definition_older_child" TEXT,
    "ticket_variant_older_child_price" TEXT,
    "ticket_variant_definition_adult" TEXT,
    "ticket_variant_adult_price" TEXT,
    "ticket_variant_definition_concession" TEXT,
    "ticket_variant_concession_price" TEXT,
    "ticket_variant_definition_group" TEXT,
    "ticket_variant_group_price" TEXT,
    "venue_parking_provision" TEXT,
    "venue_general_facilities" TEXT,
    "venue_child_facilities" TEXT,
    "venue_adult_facilities" TEXT,
    "venue_age_suitability_under_1_s" BOOLEAN,
    "venue_age_suitability_1_to_2_years" BOOLEAN,
    "venue_age_suitability_3_to_4_years" BOOLEAN,
    "venue_age_suitability_5_to_7_years" BOOLEAN,
    "venue_age_suitability_8_to_12_years" BOOLEAN,
    "venue_age_suitability_over_13_years" BOOLEAN,
    "venue_age_suitability_adults" BOOLEAN,
    "venue_age_suitability_grandparents" BOOLEAN,
    "venue_physical_setting" TEXT,
    "venue_detailed_weather_suitability" TEXT,
    "venue_estimated_duration" TEXT,
    "venue_interest_tags" TEXT,
    "venue_seasonal_tag" TEXT,
    "venue_seasonal_highlights" TEXT,
    "venue_attractions" TEXT,
    "venue_extra_kit" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_venue_v2_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_venue_v2_venue_opportunity_theme_id_idx" ON "opportunity_venue_v2"("venue_opportunity_theme_id");

-- CreateIndex
CREATE INDEX "opportunity_venue_v2_venue_opportunity_theme_variant_id_idx" ON "opportunity_venue_v2"("venue_opportunity_theme_variant_id");

-- CreateIndex
CREATE INDEX "opportunity_theme_recordType_idx" ON "opportunity_theme"("recordType");

-- AddForeignKey
ALTER TABLE "opportunity_venue_v2" ADD CONSTRAINT "opportunity_venue_v2_venue_opportunity_theme_id_fkey" FOREIGN KEY ("venue_opportunity_theme_id") REFERENCES "opportunity_theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_venue_v2" ADD CONSTRAINT "opportunity_venue_v2_venue_opportunity_theme_variant_id_fkey" FOREIGN KEY ("venue_opportunity_theme_variant_id") REFERENCES "opportunity_theme_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
