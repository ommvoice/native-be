-- Flatten SkillGroup into Skill (type + subCategoryId on skills).

ALTER TABLE "skills" ADD COLUMN "type" "SKILL_GROUP_TYPE";
ALTER TABLE "skills" ADD COLUMN "subCategoryId" TEXT;

UPDATE "skills" AS s
SET
  "type" = g."type",
  "subCategoryId" = g."subCategoryId"
FROM "skill_groups" AS g
WHERE s."groupId" = g."id";

ALTER TABLE "skills" ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "skills" ADD CONSTRAINT "skills_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "interest_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skills" DROP CONSTRAINT "skills_groupId_fkey";
ALTER TABLE "skills" DROP COLUMN "groupId";

DROP TABLE "skill_groups";
