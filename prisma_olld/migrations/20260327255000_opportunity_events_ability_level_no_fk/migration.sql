-- DropForeignKey (events no longer reference opportunity_ability_levels for ability level)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_abilityLevelSlug_fkey";
