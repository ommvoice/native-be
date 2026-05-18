import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import { opportunityVenueV2Include } from "./types.js";

export class OpportunityVenueV2Repository {
  async getAll() {
    return prisma.opportunityVenueV2.findMany({
      include: opportunityVenueV2Include,
      orderBy: { createdAt: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.opportunityVenueV2.findUnique({
      where: { id },
      include: opportunityVenueV2Include,
    });
  }

  async create(data: Prisma.OpportunityVenueV2UncheckedCreateInput) {
    return prisma.opportunityVenueV2.create({
      data,
      include: opportunityVenueV2Include,
    });
  }
}

export type OpportunityVenueV2Row = Awaited<
  ReturnType<OpportunityVenueV2Repository["getAll"]>
>[number];
