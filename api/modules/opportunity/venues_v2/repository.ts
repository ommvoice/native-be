import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import { opportunityVenuesV2Include } from "./types.js";

export class OpportunityVenuesV2Repository {
  async getAll() {
    return prisma.opportunityVenuesV2.findMany({
      include: opportunityVenuesV2Include,
      orderBy: { createdAt: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.opportunityVenuesV2.findUnique({
      where: { id },
      include: opportunityVenuesV2Include,
    });
  }

  async create(data: Prisma.OpportunityVenuesV2UncheckedCreateInput) {
    return prisma.opportunityVenuesV2.create({
      data,
      include: opportunityVenuesV2Include,
    });
  }
}

export type OpportunityVenuesV2Row = Awaited<
  ReturnType<OpportunityVenuesV2Repository["getAll"]>
>[number];
