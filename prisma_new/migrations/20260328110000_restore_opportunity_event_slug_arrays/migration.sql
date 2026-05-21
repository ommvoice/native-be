-- Ensure slug array columns exist on opportunity_events (idempotent).
-- Fixes DBs that applied the removed reversion migration or never received the array migrations.

ALTER TABLE "opportunity_events" ADD COLUMN IF NOT EXISTS "generalFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_events" ADD COLUMN IF NOT EXISTS "kidsFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_events" ADD COLUMN IF NOT EXISTS "parentFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_events" ADD COLUMN IF NOT EXISTS "ageSuitabilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_events" ADD COLUMN IF NOT EXISTS "extraKitSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_events" ADD COLUMN IF NOT EXISTS "seasonalHighlightSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "opportunity_events" ADD COLUMN IF NOT EXISTS "highlightAttractionSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- If implicit M2M join tables exist, copy into arrays and drop them (A/B match original Prisma join tables).

DO $$
BEGIN
  IF to_regclass('public."_GeneralFacilityToOpportunityEvent"') IS NOT NULL THEN
    UPDATE "opportunity_events" e
    SET "generalFacilitySlugs" = sub.slugs
    FROM (
      SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
      FROM "_GeneralFacilityToOpportunityEvent"
      GROUP BY "B"
    ) sub
    WHERE e.id = sub.event_id;
    DROP TABLE "_GeneralFacilityToOpportunityEvent";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."_KidsFacilityToOpportunityEvent"') IS NOT NULL THEN
    UPDATE "opportunity_events" e
    SET "kidsFacilitySlugs" = sub.slugs
    FROM (
      SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
      FROM "_KidsFacilityToOpportunityEvent"
      GROUP BY "B"
    ) sub
    WHERE e.id = sub.event_id;
    DROP TABLE "_KidsFacilityToOpportunityEvent";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."_OpportunityEventToParentFacility"') IS NOT NULL THEN
    UPDATE "opportunity_events" e
    SET "parentFacilitySlugs" = sub.slugs
    FROM (
      SELECT "A" AS event_id, array_agg("B" ORDER BY "B") AS slugs
      FROM "_OpportunityEventToParentFacility"
      GROUP BY "A"
    ) sub
    WHERE e.id = sub.event_id;
    DROP TABLE "_OpportunityEventToParentFacility";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."_AgeSuitabilityToOpportunityEvent"') IS NOT NULL THEN
    UPDATE "opportunity_events" e
    SET "ageSuitabilitySlugs" = sub.slugs
    FROM (
      SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
      FROM "_AgeSuitabilityToOpportunityEvent"
      GROUP BY "B"
    ) sub
    WHERE e.id = sub.event_id;
    DROP TABLE "_AgeSuitabilityToOpportunityEvent";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."_ExtraKitToOpportunityEvent"') IS NOT NULL THEN
    UPDATE "opportunity_events" e
    SET "extraKitSlugs" = sub.slugs
    FROM (
      SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
      FROM "_ExtraKitToOpportunityEvent"
      GROUP BY "B"
    ) sub
    WHERE e.id = sub.event_id;
    DROP TABLE "_ExtraKitToOpportunityEvent";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."_OpportunityEventToSeasonalHighlight"') IS NOT NULL THEN
    UPDATE "opportunity_events" e
    SET "seasonalHighlightSlugs" = sub.slugs
    FROM (
      SELECT "A" AS event_id, array_agg("B" ORDER BY "B") AS slugs
      FROM "_OpportunityEventToSeasonalHighlight"
      GROUP BY "A"
    ) sub
    WHERE e.id = sub.event_id;
    DROP TABLE "_OpportunityEventToSeasonalHighlight";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."_HighlightAttractionToOpportunityEvent"') IS NOT NULL THEN
    UPDATE "opportunity_events" e
    SET "highlightAttractionSlugs" = sub.slugs
    FROM (
      SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
      FROM "_HighlightAttractionToOpportunityEvent"
      GROUP BY "B"
    ) sub
    WHERE e.id = sub.event_id;
    DROP TABLE "_HighlightAttractionToOpportunityEvent";
  END IF;
END $$;
