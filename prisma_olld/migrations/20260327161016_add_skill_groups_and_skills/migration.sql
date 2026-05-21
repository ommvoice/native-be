-- CreateEnum
CREATE TYPE "SKILL_GROUP_TYPE" AS ENUM ('INTEREST_BASED', 'AGE_BASED');

-- CreateTable
CREATE TABLE "skill_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SKILL_GROUP_TYPE" NOT NULL,
    "label" TEXT NOT NULL,
    "categoryId" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_groups_slug_key" ON "skill_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- AddForeignKey
ALTER TABLE "skill_groups" ADD CONSTRAINT "skill_groups_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "interest_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "skill_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
