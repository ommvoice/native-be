-- OpportunityClub: store list fields as slug arrays; drop M2M join tables and FKs from clubs to lookups.

ALTER TABLE "opportunity_clubs" ADD COLUMN "generalFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_clubs" ADD COLUMN "kidsFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_clubs" ADD COLUMN "parentFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_clubs" ADD COLUMN "ageSuitabilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_clubs" ADD COLUMN "extraKitSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_clubs" ADD COLUMN "seasonalHighlightSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_clubs" ADD COLUMN "highlightAttractionSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "opportunity_clubs" c
SET "generalFacilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS club_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_GeneralFacilityToOpportunityClub"
  GROUP BY "B"
) agg
WHERE c.id = agg.club_id;

UPDATE "opportunity_clubs" c
SET "kidsFacilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS club_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_KidsFacilityToOpportunityClub"
  GROUP BY "B"
) agg
WHERE c.id = agg.club_id;

UPDATE "opportunity_clubs" c
SET "ageSuitabilitySlugs" = agg.slugs
FROM (
  SELECT "B" AS club_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_AgeSuitabilityToOpportunityClub"
  GROUP BY "B"
) agg
WHERE c.id = agg.club_id;

UPDATE "opportunity_clubs" c
SET "extraKitSlugs" = agg.slugs
FROM (
  SELECT "B" AS club_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_ExtraKitToOpportunityClub"
  GROUP BY "B"
) agg
WHERE c.id = agg.club_id;

UPDATE "opportunity_clubs" c
SET "highlightAttractionSlugs" = agg.slugs
FROM (
  SELECT "B" AS club_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_HighlightAttractionToOpportunityClub"
  GROUP BY "B"
) agg
WHERE c.id = agg.club_id;

UPDATE "opportunity_clubs" c
SET "parentFacilitySlugs" = agg.slugs
FROM (
  SELECT "A" AS club_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityClubToParentFacility"
  GROUP BY "A"
) agg
WHERE c.id = agg.club_id;

UPDATE "opportunity_clubs" c
SET "seasonalHighlightSlugs" = agg.slugs
FROM (
  SELECT "A" AS club_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityClubToSeasonalHighlight"
  GROUP BY "A"
) agg
WHERE c.id = agg.club_id;

DROP TABLE IF EXISTS "_GeneralFacilityToOpportunityClub";
DROP TABLE IF EXISTS "_KidsFacilityToOpportunityClub";
DROP TABLE IF EXISTS "_AgeSuitabilityToOpportunityClub";
DROP TABLE IF EXISTS "_ExtraKitToOpportunityClub";
DROP TABLE IF EXISTS "_HighlightAttractionToOpportunityClub";
DROP TABLE IF EXISTS "_OpportunityClubToParentFacility";
DROP TABLE IF EXISTS "_OpportunityClubToSeasonalHighlight";

ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_themeSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_themeVariantSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_dayOfWeekSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_activityGroupSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_clubFormatSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_clubFrequencySlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_commitmentSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_skillAreaSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_abilityLevelSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_parkingProvisionSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_venueSettingSlug_fkey";
ALTER TABLE "opportunity_clubs" DROP CONSTRAINT IF EXISTS "opportunity_clubs_seasonalTagSlug_fkey";
