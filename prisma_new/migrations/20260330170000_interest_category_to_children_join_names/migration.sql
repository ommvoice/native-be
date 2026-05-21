-- Replace implicit `_ChildrenToInterestCategory` / `_ChildrenToInterestSubCategory`
-- with `_InterestCategoryToChildren` / `_InterestSubCategoryToChildren` (same naming style as parents).

-- CreateTable
CREATE TABLE "_InterestCategoryToChildren" (
    "interestCategoryId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "_InterestCategoryToChildren_pkey" PRIMARY KEY ("interestCategoryId","childId")
);

-- CreateIndex
CREATE INDEX "_InterestCategoryToChildren_childId_idx" ON "_InterestCategoryToChildren"("childId");

-- AddForeignKey
ALTER TABLE "_InterestCategoryToChildren" ADD CONSTRAINT "_InterestCategoryToChildren_interestCategoryId_fkey" FOREIGN KEY ("interestCategoryId") REFERENCES "interest_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestCategoryToChildren" ADD CONSTRAINT "_InterestCategoryToChildren_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "_InterestSubCategoryToChildren" (
    "interestSubCategoryId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "_InterestSubCategoryToChildren_pkey" PRIMARY KEY ("interestSubCategoryId","childId")
);

-- CreateIndex
CREATE INDEX "_InterestSubCategoryToChildren_childId_idx" ON "_InterestSubCategoryToChildren"("childId");

-- AddForeignKey
ALTER TABLE "_InterestSubCategoryToChildren" ADD CONSTRAINT "_InterestSubCategoryToChildren_interestSubCategoryId_fkey" FOREIGN KEY ("interestSubCategoryId") REFERENCES "interest_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestSubCategoryToChildren" ADD CONSTRAINT "_InterestSubCategoryToChildren_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate from old implicit join tables (Prisma used A = child id, B = category / subcategory id)
INSERT INTO "_InterestCategoryToChildren" ("interestCategoryId", "childId")
SELECT "B", "A" FROM "_ChildrenToInterestCategory";

INSERT INTO "_InterestSubCategoryToChildren" ("interestSubCategoryId", "childId")
SELECT "B", "A" FROM "_ChildrenToInterestSubCategory";

-- DropTable
DROP TABLE "_ChildrenToInterestCategory";

-- DropTable
DROP TABLE "_ChildrenToInterestSubCategory";
