-- Align DB with schema: option group columns removed from opportunity_theme.

DROP INDEX IF EXISTS "opportunity_theme_recordType_optionGroupSlug_idx";

ALTER TABLE "opportunity_theme" DROP COLUMN IF EXISTS "optionGroupLabel";
ALTER TABLE "opportunity_theme" DROP COLUMN IF EXISTS "optionGroupSlug";
