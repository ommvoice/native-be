import prisma from "../../database/database.config.js";
import type { RequestChildrenCreateDto } from "./dto.js";

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

const childInterestInclude = {
  parent: true,
  interestCategories: {
    orderBy: { slug: "asc" },
    select: interestCategorySelect,
  },
  interestSubCategories: {
    orderBy: { slug: "asc" },
    select: interestSubCategorySelect,
  },
} as const;

export class ChildrenRepository {
  async getById(id: string) {
    return prisma.children.findUnique({
      where: { id },
      include: childInterestInclude,
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

  async create(dto: RequestChildrenCreateDto): Promise<string[]> {
    if (!dto.children?.length) return [];

    const created = await prisma.$transaction(
      dto.children.map((child) =>
        prisma.children.create({
          data: {
            parentId: dto.parentId,
            nameOrNickName: child.nameOrNickName,
            dateOfBirth: new Date(child.dateOfBirth),
          },
        }),
      ),
    );
    return created.map((c) => c.id);
  }

  async updateInterestPreferences(
    childId: string,
    categoryIds: string[],
    subCategoryIds: string[],
  ) {
    return prisma.children.update({
      where: { id: childId },
      data: {
        interestCategories: {
          set: categoryIds.map((cid) => ({ id: cid })),
        },
        interestSubCategories: {
          set: subCategoryIds.map((sid) => ({ id: sid })),
        },
      },
      include: childInterestInclude,
    });
  }
}
