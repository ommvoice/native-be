-- Slug is unique per parent category (same slug may appear under different interests).
DROP INDEX IF EXISTS "interest_sub_categories_slug_key";

CREATE UNIQUE INDEX "interest_sub_categories_categoryId_slug_key" ON "interest_sub_categories"("categoryId", "slug");
