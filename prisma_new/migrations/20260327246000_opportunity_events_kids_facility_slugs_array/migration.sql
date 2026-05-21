-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN "kidsFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Copy existing M2M links (join table columns are "A" / "B")
UPDATE "opportunity_events" e
SET "kidsFacilitySlugs" = sub.slugs
FROM (
  SELECT "B" AS event_id, array_agg("A" ORDER BY "A") AS slugs
  FROM "_KidsFacilityToOpportunityEvent"
  GROUP BY "B"
) sub
WHERE e.id = sub.event_id;

-- DropTable
DROP TABLE "_KidsFacilityToOpportunityEvent";
