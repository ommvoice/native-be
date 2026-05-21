-- DropForeignKey (events no longer reference opportunity_skill_areas for skill area)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_skillAreaSlug_fkey";
