-- DropForeignKey
ALTER TABLE "skill_groups" DROP CONSTRAINT "skill_groups_categoryId_fkey";

-- Existing categoryId values reference interest_categories, not interest_sub_categories; clear before retargeting FK.
UPDATE "skill_groups" SET "categoryId" = NULL WHERE "categoryId" IS NOT NULL;

-- AlterTable
ALTER TABLE "skill_groups" RENAME COLUMN "categoryId" TO "subCategoryId";

-- AddForeignKey
ALTER TABLE "skill_groups" ADD CONSTRAINT "skill_groups_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "interest_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
