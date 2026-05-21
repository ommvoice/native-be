-- CreateTable
CREATE TABLE "_InterestCategoryToParents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InterestCategoryToParents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InterestCategoryToParents_B_index" ON "_InterestCategoryToParents"("B");

-- AddForeignKey
ALTER TABLE "_InterestCategoryToParents" ADD CONSTRAINT "_InterestCategoryToParents_A_fkey" FOREIGN KEY ("A") REFERENCES "interest_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestCategoryToParents" ADD CONSTRAINT "_InterestCategoryToParents_B_fkey" FOREIGN KEY ("B") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
