-- AlterTable: parent facilities on events as slug array (no M2M for events)
ALTER TABLE "opportunity_events" ADD COLUMN "parentFacilitySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
