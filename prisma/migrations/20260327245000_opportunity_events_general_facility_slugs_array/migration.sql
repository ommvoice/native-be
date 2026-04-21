-- AlterTable: store event general facility slugs in-array (no M2M join for events)
ALTER TABLE "opportunity_events" ADD COLUMN "generalFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Copy existing M2M links into the new column (join table uses quoted "A" / "B")
UPDATE "opportunity_events" e
SET "generalFacilitySlugs" = sub.slugs
FROM (
  SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_GeneralFacilityToOpportunityEvent"
  GROUP BY "B"
) sub
WHERE e.id = sub.event_id;

-- DropTable
DROP TABLE "_GeneralFacilityToOpportunityEvent";
