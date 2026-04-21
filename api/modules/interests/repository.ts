import prisma from "../../database/database.config.js";
import type { InterestCategoryResponse, InterestSubCategoryResponse } from "./types.js";

type FlatSubCategory = {
  id: string;
  slug: string;
  name: string;
  suitableForAge: string | null;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
};

/** Builds a forest of roots → nested `subCategories` from a flat Prisma list (any depth). */
function buildSubCategoryTree(flat: FlatSubCategory[]): InterestSubCategoryResponse[] {
  const nodes = new Map<string, InterestSubCategoryResponse>();
  for (const row of flat) {
    nodes.set(row.id, {
      id: row.id,
      slug: row.slug,
      name: row.name,
      suitableForAge: row.suitableForAge,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      subCategories: [],
    });
  }

  const roots: InterestSubCategoryResponse[] = [];
  for (const row of flat) {
    const node = nodes.get(row.id);
    if (!node) continue;
    if (row.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodes.get(row.parentId);
      if (parent) {
        parent.subCategories.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  const sortBySlug = (list: InterestSubCategoryResponse[]) => {
    list.sort((a, b) => a.slug.localeCompare(b.slug));
    for (const n of list) sortBySlug(n.subCategories);
  };
  sortBySlug(roots);

  return roots;
}

export class InterestRepository {
  async getAll(): Promise<InterestCategoryResponse[]> {
    const categories = await prisma.interestCategory.findMany({
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        subCategories: {
          orderBy: [{ slug: "asc" }],
          select: {
            id: true,
            slug: true,
            name: true,
            suitableForAge: true,
            createdAt: true,
            updatedAt: true,
            parentId: true,
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      subCategories: buildSubCategoryTree(cat.subCategories),
    }));
  }
}

export type InterestCategoryRow = Awaited<
  ReturnType<InterestRepository["getAll"]>
>[number];
