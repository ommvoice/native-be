-- DropForeignKey (events no longer reference opportunity_venue_settings for venue setting)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_venueSettingSlug_fkey";
