-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN "seasonalHighlightSlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Copy M2M ("A" = event id, "B" = seasonal highlight slug)
UPDATE "opportunity_events" e
SET "seasonalHighlightSlugs" = sub.slugs
FROM (
  SELECT "A" AS event_id, array_agg("B" ORDER BY "B") AS slugs
  FROM "_OpportunityEventToSeasonalHighlight"
  GROUP BY "A"
) sub
WHERE e.id = sub.event_id;

-- DropTable
DROP TABLE "_OpportunityEventToSeasonalHighlight";
