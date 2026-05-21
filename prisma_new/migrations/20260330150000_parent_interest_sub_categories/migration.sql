-- CreateTable
CREATE TABLE "_InterestSubCategoryToParents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InterestSubCategoryToParents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InterestSubCategoryToParents_B_index" ON "_InterestSubCategoryToParents"("B");

-- AddForeignKey
ALTER TABLE "_InterestSubCategoryToParents" ADD CONSTRAINT "_InterestSubCategoryToParents_A_fkey" FOREIGN KEY ("A") REFERENCES "interest_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestSubCategoryToParents" ADD CONSTRAINT "_InterestSubCategoryToParents_B_fkey" FOREIGN KEY ("B") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
