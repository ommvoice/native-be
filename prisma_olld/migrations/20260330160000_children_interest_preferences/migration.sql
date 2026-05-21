-- CreateTable
CREATE TABLE "_ChildrenToInterestCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChildrenToInterestCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ChildrenToInterestSubCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChildrenToInterestSubCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ChildrenToInterestCategory_B_index" ON "_ChildrenToInterestCategory"("B");

-- CreateIndex
CREATE INDEX "_ChildrenToInterestSubCategory_B_index" ON "_ChildrenToInterestSubCategory"("B");

-- AddForeignKey
ALTER TABLE "_ChildrenToInterestCategory" ADD CONSTRAINT "_ChildrenToInterestCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChildrenToInterestCategory" ADD CONSTRAINT "_ChildrenToInterestCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "interest_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChildrenToInterestSubCategory" ADD CONSTRAINT "_ChildrenToInterestSubCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChildrenToInterestSubCategory" ADD CONSTRAINT "_ChildrenToInterestSubCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "interest_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
