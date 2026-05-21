-- DropForeignKey (events no longer reference opportunity_activity_groups for activity group)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_activityGroupSlug_fkey";
