-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN "ageSuitabilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Copy M2M ("A" = age slug, "B" = event id)
UPDATE "opportunity_events" e
SET "ageSuitabilitySlugs" = sub.slugs
FROM (
  SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_AgeSuitabilityToOpportunityEvent"
  GROUP BY "B"
) sub
WHERE e.id = sub.event_id;

-- DropTable
DROP TABLE "_AgeSuitabilityToOpportunityEvent";
