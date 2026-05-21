-- DropForeignKey (events no longer reference opportunity_parking_provisions for parking)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_parkingProvisionSlug_fkey";
