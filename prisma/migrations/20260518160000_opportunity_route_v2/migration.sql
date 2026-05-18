-- Route spreadsheet import (v2 flat columns; theme FKs like opportunity_club_v2).

CREATE TABLE "opportunity_route_v2" (
    "id" TEXT NOT NULL,
    "opportunity_type" "OpportunityRecordType" NOT NULL DEFAULT 'route',
    "route_opportunity_theme_id" TEXT NOT NULL,
    "route_opportunity_theme_variant_id" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "route_activity_grouping" TEXT,
    "route_description" TEXT,
    "route_type" TEXT,
    "route_distance" TEXT,
    "route_terrain_type" TEXT,
    "route_difficulty" TEXT,
    "route_address_line_1" TEXT,
    "route_address_line_2" TEXT,
    "route_region" TEXT,
    "route_postcode" VARCHAR(20),
    "latitude" TEXT,
    "longitude" TEXT,
    "route_country" TEXT,
    "route_parking_provision" TEXT,
    "route_general_facilities" TEXT,
    "route_child_facilities" TEXT,
    "route_adult_facilities" TEXT,
    "route_dog_facilities" TEXT,
    "route_age_suitability_under_1_s" BOOLEAN,
    "route_age_suitability_1_to_2_years" BOOLEAN,
    "route_age_suitability_3_to_4_years" BOOLEAN,
    "route_age_suitability_5_to_7_years" BOOLEAN,
    "route_age_suitability_8_to_12_years" BOOLEAN,
    "route_age_suitability_over_13_years" BOOLEAN,
    "route_age_suitability_adults" BOOLEAN,
    "route_physical_setting" TEXT,
    "route_detailed_weather_suitability" TEXT,
    "route_estimated_duration" TEXT,
    "route_interest_tags" TEXT,
    "route_seasonal_tag" TEXT,
    "route_seasonal_highlights" TEXT,
    "route_attractions" TEXT,
    "route_extra_kit" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_route_v2_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "opportunity_route_v2_route_opportunity_theme_id_idx" ON "opportunity_route_v2"("route_opportunity_theme_id");

CREATE INDEX "opportunity_route_v2_route_opportunity_theme_variant_id_idx" ON "opportunity_route_v2"("route_opportunity_theme_variant_id");

ALTER TABLE "opportunity_route_v2" ADD CONSTRAINT "opportunity_route_v2_route_opportunity_theme_id_fkey" FOREIGN KEY ("route_opportunity_theme_id") REFERENCES "opportunity_theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "opportunity_route_v2" ADD CONSTRAINT "opportunity_route_v2_route_opportunity_theme_variant_id_fkey" FOREIGN KEY ("route_opportunity_theme_variant_id") REFERENCES "opportunity_theme_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
