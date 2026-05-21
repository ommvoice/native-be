-- AlterTable
ALTER TABLE "interest_categories" ADD COLUMN "slug" TEXT;

-- Backfill any pre-existing rows (legacy data without slugs)
UPDATE "interest_categories"
SET "slug" = 'legacy_' || REPLACE(id::text, '-', '')
WHERE "slug" IS NULL;

ALTER TABLE "interest_categories" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "interest_categories_slug_key" ON "interest_categories"("slug");
