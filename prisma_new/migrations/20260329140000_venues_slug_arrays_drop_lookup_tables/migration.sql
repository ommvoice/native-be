-- Venues: facility lists as slug arrays (like clubs). Drop venue M2M join tables and FKs.
-- Then drop all opportunity_* lookup tables (labels live in application code / seed data arrays only).

ALTER TABLE "opportunity_venues" ADD COLUMN "generalFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_venues" ADD COLUMN "kidsFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_venues" ADD COLUMN "parentFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_venues" ADD COLUMN "ageSuitabilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_venues" ADD COLUMN "extraKitSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_venues" ADD COLUMN "seasonalHighlightSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_venues" ADD COLUMN "highlightAttractionSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "opportunity_venues" v
SET "generalFacilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS venue_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_GeneralFacilityToOpportunityVenue"
  GROUP BY "B"
) agg
WHERE v.id = agg.venue_id;

UPDATE "opportunity_venues" v
SET "kidsFacilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS venue_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_KidsFacilityToOpportunityVenue"
  GROUP BY "B"
) agg
WHERE v.id = agg.venue_id;

UPDATE "opportunity_venues" v
SET "ageSuitabilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS venue_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_AgeSuitabilityToOpportunityVenue"
  GROUP BY "B"
) agg
WHERE v.id = agg.venue_id;

UPDATE "opportunity_venues" v
SET "extraKitSlugs" = agg.slugs
FROM (
  SELECT "B" AS venue_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_ExtraKitToOpportunityVenue"
  GROUP BY "B"
) agg
WHERE v.id = agg.venue_id;

UPDATE "opportunity_venues" v
SET "highlightAttractionSlugs" = agg.slugs
FROM (
  SELECT "B" AS venue_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_HighlightAttractionToOpportunityVenue"
  GROUP BY "B"
) agg
WHERE v.id = agg.venue_id;

UPDATE "opportunity_venues" v
SET "parentFacilitySlugs" = agg.slugs
FROM (
  SELECT "A" AS venue_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityVenueToParentFacility"
  GROUP BY "A"
) agg
WHERE v.id = agg.venue_id;

UPDATE "opportunity_venues" v
SET "seasonalHighlightSlugs" = agg.slugs
FROM (
  SELECT "A" AS venue_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityVenueToSeasonalHighlight"
  GROUP BY "A"
) agg
WHERE v.id = agg.venue_id;

DROP TABLE IF EXISTS "_GeneralFacilityToOpportunityVenue";
DROP TABLE IF EXISTS "_KidsFacilityToOpportunityVenue";
DROP TABLE IF EXISTS "_AgeSuitabilityToOpportunityVenue";
DROP TABLE IF EXISTS "_ExtraKitToOpportunityVenue";
DROP TABLE IF EXISTS "_HighlightAttractionToOpportunityVenue";
DROP TABLE IF EXISTS "_OpportunityVenueToParentFacility";
DROP TABLE IF EXISTS "_OpportunityVenueToSeasonalHighlight";

ALTER TABLE "opportunity_venues" DROP CONSTRAINT IF EXISTS "opportunity_venues_themeSlug_fkey";
ALTER TABLE "opportunity_venues" DROP CONSTRAINT IF EXISTS "opportunity_venues_themeVariantSlug_fkey";
ALTER TABLE "opportunity_venues" DROP CONSTRAINT IF EXISTS "opportunity_venues_activityGroupSlug_fkey";
ALTER TABLE "opportunity_venues" DROP CONSTRAINT IF EXISTS "opportunity_venues_terrainTypeSlug_fkey";
ALTER TABLE "opportunity_venues" DROP CONSTRAINT IF EXISTS "opportunity_venues_venueSettingSlug_fkey";
ALTER TABLE "opportunity_venues" DROP CONSTRAINT IF EXISTS "opportunity_venues_parkingProvisionSlug_fkey";
ALTER TABLE "opportunity_venues" DROP CONSTRAINT IF EXISTS "opportunity_venues_seasonalTagSlug_fkey";

-- Any leftover M2M tables pointing at lookup rows (safe if already removed by prior migrations).
DROP TABLE IF EXISTS "_GeneralFacilityToOpportunityEvent";
DROP TABLE IF EXISTS "_KidsFacilityToOpportunityEvent";
DROP TABLE IF EXISTS "_OpportunityEventToParentFacility";
DROP TABLE IF EXISTS "_AgeSuitabilityToOpportunityEvent";
DROP TABLE IF EXISTS "_ExtraKitToOpportunityEvent";
DROP TABLE IF EXISTS "_OpportunityEventToSeasonalHighlight";
DROP TABLE IF EXISTS "_HighlightAttractionToOpportunityEvent";
DROP TABLE IF EXISTS "_GeneralFacilityToOpportunityClub";
DROP TABLE IF EXISTS "_KidsFacilityToOpportunityClub";
DROP TABLE IF EXISTS "_AgeSuitabilityToOpportunityClub";
DROP TABLE IF EXISTS "_ExtraKitToOpportunityClub";
DROP TABLE IF EXISTS "_HighlightAttractionToOpportunityClub";
DROP TABLE IF EXISTS "_OpportunityClubToParentFacility";
DROP TABLE IF EXISTS "_OpportunityClubToSeasonalHighlight";
DROP TABLE IF EXISTS "_OpportunityRouteToRouteSuitability";
DROP TABLE IF EXISTS "_OpportunityRouteToTerrainType";
DROP TABLE IF EXISTS "_GeneralFacilityToOpportunityRoute";
DROP TABLE IF EXISTS "_KidsFacilityToOpportunityRoute";
DROP TABLE IF EXISTS "_OpportunityRouteToParentFacility";
DROP TABLE IF EXISTS "_DogFacilityToOpportunityRoute";
DROP TABLE IF EXISTS "_ExtraKitToOpportunityRoute";
DROP TABLE IF EXISTS "_OpportunityRouteToSeasonalHighlight";
DROP TABLE IF EXISTS "_HighlightAttractionToOpportunityRoute";

DROP TABLE IF EXISTS "opportunity_themes";
DROP TABLE IF EXISTS "opportunity_theme_variants";
DROP TABLE IF EXISTS "opportunity_terrain_types";
DROP TABLE IF EXISTS "opportunity_parent_facilities";
DROP TABLE IF EXISTS "opportunity_activity_groups";
DROP TABLE IF EXISTS "opportunity_parking_provisions";
DROP TABLE IF EXISTS "opportunity_venue_settings";
DROP TABLE IF EXISTS "opportunity_general_facilities";
DROP TABLE IF EXISTS "opportunity_kids_facilities";
DROP TABLE IF EXISTS "opportunity_age_suitabilities";
DROP TABLE IF EXISTS "opportunity_skill_areas";
DROP TABLE IF EXISTS "opportunity_ability_levels";
DROP TABLE IF EXISTS "opportunity_extra_kits";
DROP TABLE IF EXISTS "opportunity_seasonal_tags";
DROP TABLE IF EXISTS "opportunity_seasonal_highlights";
DROP TABLE IF EXISTS "opportunity_highlight_attractions";
DROP TABLE IF EXISTS "opportunity_days_of_week";
DROP TABLE IF EXISTS "opportunity_club_formats";
DROP TABLE IF EXISTS "opportunity_club_frequencies";
DROP TABLE IF EXISTS "opportunity_commitments";
DROP TABLE IF EXISTS "opportunity_route_types";
DROP TABLE IF EXISTS "opportunity_route_suitabilities";
DROP TABLE IF EXISTS "opportunity_difficulty_ratings";
DROP TABLE IF EXISTS "opportunity_dog_facilities";
