-- AlterTable
ALTER TABLE "interest_sub_categories" ADD COLUMN "suitableForAge" TEXT,
ADD COLUMN "parentId" TEXT;

-- DropIndex
DROP INDEX "interest_sub_categories_categoryId_slug_key";

-- CreateIndex
CREATE INDEX "interest_sub_categories_parentId_idx" ON "interest_sub_categories"("parentId");

-- AddForeignKey
ALTER TABLE "interest_sub_categories" ADD CONSTRAINT "interest_sub_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "interest_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "interest_sub_categories_categoryId_parentId_slug_key" ON "interest_sub_categories"("categoryId", "parentId", "slug");
