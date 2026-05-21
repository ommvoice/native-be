-- DropIndex
DROP INDEX "interest_sub_categories_parentId_idx";

-- CreateTable
CREATE TABLE "_ChildrenToSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChildrenToSkill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ChildrenToSkill_B_index" ON "_ChildrenToSkill"("B");

-- AddForeignKey
ALTER TABLE "_ChildrenToSkill" ADD CONSTRAINT "_ChildrenToSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChildrenToSkill" ADD CONSTRAINT "_ChildrenToSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "parent_opportunity_driving_legs_parentId_opportunityType_opport" RENAME TO "parent_opportunity_driving_legs_parentId_opportunityType_op_key";
