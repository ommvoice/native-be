-- Merge `opportunity_venue_v2` (event import) into `opportunity_venues_v2`; drop singular table.
-- Event theme FKs are copied onto `venue_opportunity_theme_id` / `venue_opportunity_theme_variant_id`.

ALTER TABLE "opportunity_venues_v2" ALTER COLUMN "venue_name" DROP NOT NULL;

ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "ticket_sales_start_date" TIMESTAMP(3);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_name" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_activity_group" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_type" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_description" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_address_line_1" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_address_line_2" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_city" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_region" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_postcode" VARCHAR(20);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_country" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_physical_setting" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_detailed_weather_suitability" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_start_date" TIMESTAMP(3);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_end_date" TIMESTAMP(3);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_days_total" INTEGER;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_daily_multi_session" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_timetable_weekly" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_daily_fixed_timings" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_daily_fixed_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_daily_fixed_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_daily_multi_session_total" INTEGER;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_daily_multi_session_timings" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_weekly_fixed_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_weekly_fixed_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_monday_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_monday_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_tuesday_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_tuesday_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_wednesday_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_wednesday_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_thursday_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_thursday_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_friday_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_friday_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_saturday_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_saturday_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_sunday_start_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_mixed_timings_sunday_end_time" VARCHAR(5);
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_entry_cost" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_booking_type" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_parking_provision" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_general_facilities" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_child_facilities" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_adult_facilities" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_age_suitability_under_1_s" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_age_suitability_1_to_2_years" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_age_suitability_3_to_4_years" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_age_suitability_5_to_7_years" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_age_suitability_8_to_12_years" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_age_suitability_over_13_years" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_age_suitability_adults" BOOLEAN;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_interest_tags" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_seasonal_tags" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_seasonal_highlights" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_highlights" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_extra_kit" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_skill_area" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_skill_area_variant" TEXT;
ALTER TABLE "opportunity_venues_v2" ADD COLUMN IF NOT EXISTS "event_ability_level" TEXT;

INSERT INTO "opportunity_venues_v2" (
    "id",
    "opportunity_type",
    "venue_opportunity_theme_id",
    "venue_opportunity_theme_variant_id",
    "latitude",
    "longitude",
    "ticketing_variants",
    "ticket_variant_definition_baby",
    "ticket_variant_baby_price",
    "ticket_variant_definition__fixed_child",
    "ticket_variant_fixed_child_price",
    "ticket_variant_definition_young_child",
    "ticket_variant_young_child_price",
    "ticket_variant_definition_older_child",
    "ticket_variant_older_child_price",
    "ticket_variant_definition_adult",
    "ticket_variant_adult_price",
    "ticket_variant_definition_concession",
    "ticket_variant_concession_price",
    "ticket_variant_definition_group",
    "ticket_variant_group_price",
    "image",
    "createdAt",
    "updatedAt",
    "ticket_sales_start_date",
    "event_name",
    "event_activity_group",
    "event_type",
    "event_description",
    "event_address_line_1",
    "event_address_line_2",
    "event_city",
    "event_region",
    "event_postcode",
    "event_country",
    "event_physical_setting",
    "event_detailed_weather_suitability",
    "event_start_date",
    "event_end_date",
    "event_days_total",
    "event_daily_multi_session",
    "event_timetable_weekly",
    "event_daily_fixed_timings",
    "event_daily_fixed_start_time",
    "event_daily_fixed_end_time",
    "event_daily_multi_session_total",
    "event_daily_multi_session_timings",
    "event_weekly_fixed_start_time",
    "event_weekly_fixed_end_time",
    "event_mixed_timings_monday_start_time",
    "event_mixed_timings_monday_end_time",
    "event_mixed_timings_tuesday_start_time",
    "event_mixed_timings_tuesday_end_time",
    "event_mixed_timings_wednesday_start_time",
    "event_mixed_timings_wednesday_end_time",
    "event_mixed_timings_thursday_start_time",
    "event_mixed_timings_thursday_end_time",
    "event_mixed_timings_friday_start_time",
    "event_mixed_timings_friday_end_time",
    "event_mixed_timings_saturday_start_time",
    "event_mixed_timings_saturday_end_time",
    "event_mixed_timings_sunday_start_time",
    "event_mixed_timings_sunday_end_time",
    "event_entry_cost",
    "event_booking_type",
    "event_parking_provision",
    "event_general_facilities",
    "event_child_facilities",
    "event_adult_facilities",
    "event_age_suitability_under_1_s",
    "event_age_suitability_1_to_2_years",
    "event_age_suitability_3_to_4_years",
    "event_age_suitability_5_to_7_years",
    "event_age_suitability_8_to_12_years",
    "event_age_suitability_over_13_years",
    "event_age_suitability_adults",
    "event_interest_tags",
    "event_seasonal_tags",
    "event_seasonal_highlights",
    "event_highlights",
    "event_extra_kit",
    "event_skill_area",
    "event_skill_area_variant",
    "event_ability_level"
)
SELECT
    e."id",
    e."opportunity_type",
    e."event_opportunity_theme_id",
    e."event_opportunity_theme_variant_id",
    e."latitude",
    e."longitude",
    e."ticketing_variants",
    e."ticket_variant_definition_baby",
    e."ticket_variant_baby_price",
    e."ticket_variant_definition__fixed_child",
    e."ticket_variant_fixed_child_price",
    e."ticket_variant_definition_young_child",
    e."ticket_variant_young_child_price",
    e."ticket_variant_definition_older_child",
    e."ticket_variant_older_child_price",
    e."ticket_variant_definition_adult",
    e."ticket_variant_adult_price",
    e."ticket_variant_definition_concession",
    e."ticket_variant_concession_price",
    e."ticket_variant_definition_group",
    e."ticket_variant_group_price",
    e."image",
    e."createdAt",
    e."updatedAt",
    e."ticket_sales_start_date",
    e."event_name",
    e."event_activity_group",
    e."event_type",
    e."event_description",
    e."event_address_line_1",
    e."event_address_line_2",
    e."event_city",
    e."event_region",
    e."event_postcode",
    e."event_country",
    e."event_physical_setting",
    e."event_detailed_weather_suitability",
    e."event_start_date",
    e."event_end_date",
    e."event_days_total",
    e."event_daily_multi_session",
    e."event_timetable_weekly",
    e."event_daily_fixed_timings",
    e."event_daily_fixed_start_time",
    e."event_daily_fixed_end_time",
    e."event_daily_multi_session_total",
    e."event_daily_multi_session_timings",
    e."event_weekly_fixed_start_time",
    e."event_weekly_fixed_end_time",
    e."event_mixed_timings_monday_start_time",
    e."event_mixed_timings_monday_end_time",
    e."event_mixed_timings_tuesday_start_time",
    e."event_mixed_timings_tuesday_end_time",
    e."event_mixed_timings_wednesday_start_time",
    e."event_mixed_timings_wednesday_end_time",
    e."event_mixed_timings_thursday_start_time",
    e."event_mixed_timings_thursday_end_time",
    e."event_mixed_timings_friday_start_time",
    e."event_mixed_timings_friday_end_time",
    e."event_mixed_timings_saturday_start_time",
    e."event_mixed_timings_saturday_end_time",
    e."event_mixed_timings_sunday_start_time",
    e."event_mixed_timings_sunday_end_time",
    e."event_entry_cost",
    e."event_booking_type",
    e."event_parking_provision",
    e."event_general_facilities",
    e."event_child_facilities",
    e."event_adult_facilities",
    e."event_age_suitability_under_1_s",
    e."event_age_suitability_1_to_2_years",
    e."event_age_suitability_3_to_4_years",
    e."event_age_suitability_5_to_7_years",
    e."event_age_suitability_8_to_12_years",
    e."event_age_suitability_over_13_years",
    e."event_age_suitability_adults",
    e."event_interest_tags",
    e."event_seasonal_tags",
    e."event_seasonal_highlights",
    e."event_highlights",
    e."event_extra_kit",
    e."event_skill_area",
    e."event_skill_area_variant",
    e."event_ability_level"
FROM "opportunity_venue_v2" e
WHERE NOT EXISTS (
    SELECT 1 FROM "opportunity_venues_v2" v WHERE v."id" = e."id"
);

DROP TABLE IF EXISTS "opportunity_venue_v2";

CREATE INDEX IF NOT EXISTS "opportunity_venues_v2_opportunity_type_idx" ON "opportunity_venues_v2"("opportunity_type");
