-- DropForeignKey (events no longer reference opportunity_seasonal_tags for seasonal tag)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_seasonalTagSlug_fkey";
