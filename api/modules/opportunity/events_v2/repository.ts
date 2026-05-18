import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import { opportunityVenueV2Include } from "./types.js";

export class OpportunityVenueV2Repository {
  async getAll() {
    return prisma.opportunityEventsV2.findMany({
      include: opportunityVenueV2Include,
      orderBy: { createdAt: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.opportunityEventsV2.findFirst({
      where: { id },
      include: opportunityVenueV2Include,
    });
  }

  async create(data: Prisma.OpportunityEventsV2UncheckedCreateInput) {
    return prisma.opportunityEventsV2.create({
      data,
      include: opportunityVenueV2Include,
    });
  }
}

export type OpportunityVenueV2Row = Awaited<
  ReturnType<OpportunityVenueV2Repository["getAll"]>
>[number];
