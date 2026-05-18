import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import { opportunityRouteV2Include } from "./types.js";

export class OpportunityRouteV2Repository {
  async getAll() {
    return prisma.opportunityRouteV2.findMany({
      include: opportunityRouteV2Include,
      orderBy: { createdAt: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.opportunityRouteV2.findUnique({
      where: { id },
      include: opportunityRouteV2Include,
    });
  }

  async create(data: Prisma.OpportunityRouteV2UncheckedCreateInput) {
    return prisma.opportunityRouteV2.create({
      data,
      include: opportunityRouteV2Include,
    });
  }
}

export type OpportunityRouteV2Row = Awaited<
  ReturnType<OpportunityRouteV2Repository["getAll"]>
>[number];
