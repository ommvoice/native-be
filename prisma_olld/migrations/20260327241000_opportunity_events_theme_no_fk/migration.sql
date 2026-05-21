-- DropForeignKey (events no longer reference opportunity_themes; theme slugs are app-defined for events only)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_themeSlug_fkey";
