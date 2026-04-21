import type { InterestCategory, InterestSubCategory, Skill } from "@prisma/client";
import prisma from "../../database/database.config.js";

type SubWithCategory = InterestSubCategory & { category: InterestCategory };

type SkillWithSub = Skill & { subCategory: SubWithCategory | null };

/** API shape previously backed by `SkillGroup` for interest-based lists. */
function interestGroupFromBucket(bucket: SkillWithSub[]) {
  const sub = bucket[0]!.subCategory!;
  const skills = bucket.map(({ subCategory: _sc, ...skill }) => skill);
  return {
    id: sub.id,
    slug: sub.slug,
    type: "INTEREST_BASED" as const,
    label: sub.name,
    subCategoryId: sub.id,
    skills,
    subCategory: sub,
  };
}

export class SkillRepository {
  async getInterestBased() {
    const rows = await prisma.skill.findMany({
      where: { type: "INTEREST_BASED" },
      include: { subCategory: { include: { category: true } } },
      orderBy: [{ subCategoryId: "asc" }, { label: "asc" }],
    });
    const map = new Map<string, SkillWithSub[]>();
    for (const row of rows) {
      if (!row.subCategoryId || !row.subCategory) continue;
      const list = map.get(row.subCategoryId) ?? [];
      list.push(row as SkillWithSub);
      map.set(row.subCategoryId, list);
    }
    return [...map.values()].map(interestGroupFromBucket);
  }

  async getAgeBased() {
    const skills = await prisma.skill.findMany({
      where: { type: "AGE_BASED" },
      orderBy: { label: "asc" },
    });
    return skills.map((s) => ({
      id: s.id,
      slug: s.slug,
      type: "AGE_BASED" as const,
      label: s.label,
      subCategoryId: null as string | null,
      skills: [s],
      subCategory: null,
    }));
  }

  async getAll() {
    const [interest, age] = await Promise.all([this.getInterestBased(), this.getAgeBased()]);
    return [...interest, ...age];
  }

  async getLevels() {
    return prisma.skillLevel.findMany({ orderBy: { id: "asc" } });
  }
}
