import prisma from "../../database/database.config.js";

const interestCategorySelect = {
  id: true,
  slug: true,
  name: true,
} as const;

const interestSubCategorySelect = {
  id: true,
  slug: true,
  name: true,
  categoryId: true,
} as const;

export class ParentRepository {
  async getById(id: string) {
    return prisma.parents.findUnique({
      where: { id },
      include: {
        user: true,
        children: true,
        interestCategories: {
          orderBy: { slug: "asc" },
          select: interestCategorySelect,
        },
        interestSubCategories: {
          orderBy: { slug: "asc" },
          select: interestSubCategorySelect,
        },
      },
    });
  }

  async getByUserId(userId: string) {
    return prisma.parents.findUnique({
      where: { userId },
      include: {
        children: true,
        interestCategories: {
          orderBy: { slug: "asc" },
          select: interestCategorySelect,
        },
        interestSubCategories: {
          orderBy: { slug: "asc" },
          select: interestSubCategorySelect,
        },
      },
    });
  }

  async interestCategoriesExist(ids: string[]) {
    if (ids.length === 0) return true;
    const count = await prisma.interestCategory.count({
      where: { id: { in: ids } },
    });
    return count === ids.length;
  }

  async findInterestSubCategoriesByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.interestSubCategory.findMany({
      where: { id: { in: ids } },
      select: { id: true, categoryId: true },
    });
  }

  async updateSearchRadius(id: string, searchRadius: number) {
    return prisma.parents.update({
      where: { id },
      data: {
        searchRadius,
      },
    });
  }

  async updateInterestPreferences(
    parentId: string,
    categoryIds: string[],
    subCategoryIds: string[],
  ) {
    return prisma.parents.update({
      where: { id: parentId },
      data: {
        interestCategories: {
          set: categoryIds.map((cid) => ({ id: cid })),
        },
        interestSubCategories: {
          set: subCategoryIds.map((sid) => ({ id: sid })),
        },
      },
      include: {
        user: true,
        children: true,
        interestCategories: {
          orderBy: { slug: "asc" },
          select: interestCategorySelect,
        },
        interestSubCategories: {
          orderBy: { slug: "asc" },
          select: interestSubCategorySelect,
        },
      },
    });
  }
}
