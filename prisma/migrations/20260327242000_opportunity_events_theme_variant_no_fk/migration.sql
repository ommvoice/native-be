-- DropForeignKey (events no longer reference opportunity_theme_variants for theme variant)
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_themeVariantSlug_fkey";
