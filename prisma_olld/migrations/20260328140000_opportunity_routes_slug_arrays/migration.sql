-- OpportunityRoute: slug arrays; drop M2M join tables and FKs from routes to lookups.

ALTER TABLE "opportunity_routes" ADD COLUMN "routeSuitabilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "terrainTypeSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "generalFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "kidsFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "parentFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "dogFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "extraKitSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "seasonalHighlightSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_routes" ADD COLUMN "highlightAttractionSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "opportunity_routes" r
SET "routeSuitabilitySlugs" = agg.slugs
FROM (
  SELECT "A" AS route_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityRouteToRouteSuitability"
  GROUP BY "A"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "terrainTypeSlugs" = agg.slugs
FROM (
  SELECT "A" AS route_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityRouteToTerrainType"
  GROUP BY "A"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "generalFacilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS route_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_GeneralFacilityToOpportunityRoute"
  GROUP BY "B"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "kidsFacilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS route_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_KidsFacilityToOpportunityRoute"
  GROUP BY "B"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "parentFacilitySlugs" = agg.slugs
FROM (
  SELECT "A" AS route_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityRouteToParentFacility"
  GROUP BY "A"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "dogFacilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS route_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_DogFacilityToOpportunityRoute"
  GROUP BY "B"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "extraKitSlugs" = agg.slugs
FROM (
  SELECT "B" AS route_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_ExtraKitToOpportunityRoute"
  GROUP BY "B"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "seasonalHighlightSlugs" = agg.slugs
FROM (
  SELECT "A" AS route_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityRouteToSeasonalHighlight"
  GROUP BY "A"
) agg
WHERE r.id = agg.route_id;

UPDATE "opportunity_routes" r
SET "highlightAttractionSlugs" = agg.slugs
FROM (
  SELECT "B" AS route_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_HighlightAttractionToOpportunityRoute"
  GROUP BY "B"
) agg
WHERE r.id = agg.route_id;

DROP TABLE IF EXISTS "_OpportunityRouteToRouteSuitability";
DROP TABLE IF EXISTS "_OpportunityRouteToTerrainType";
DROP TABLE IF EXISTS "_GeneralFacilityToOpportunityRoute";
DROP TABLE IF EXISTS "_KidsFacilityToOpportunityRoute";
DROP TABLE IF EXISTS "_OpportunityRouteToParentFacility";
DROP TABLE IF EXISTS "_DogFacilityToOpportunityRoute";
DROP TABLE IF EXISTS "_ExtraKitToOpportunityRoute";
DROP TABLE IF EXISTS "_OpportunityRouteToSeasonalHighlight";
DROP TABLE IF EXISTS "_HighlightAttractionToOpportunityRoute";

ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_themeSlug_fkey";
ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_themeVariantSlug_fkey";
ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_routeTypeSlug_fkey";
ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_difficultyRatingSlug_fkey";
ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_activityGroupSlug_fkey";
ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_parkingProvisionSlug_fkey";
ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_venueSettingSlug_fkey";
ALTER TABLE "opportunity_routes" DROP CONSTRAINT IF EXISTS "opportunity_routes_seasonalTagSlug_fkey";
