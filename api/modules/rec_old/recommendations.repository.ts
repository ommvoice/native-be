import prisma from "../../database/database.config.js";

export class RecommendationsRepository {
  async getActiveOpportunities() {
    return prisma.opportunity.findMany({
      where: { isActive: true },
    });
  }

  async getParentWithChildren(parentId: string) {
    return prisma.parents.findUnique({
      where: { id: parentId },
      include: { children: true },
    });
  }
}
