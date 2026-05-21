-- DropForeignKey
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_eventTypeSlug_fkey";

-- DropTable
DROP TABLE "opportunity_event_types";
