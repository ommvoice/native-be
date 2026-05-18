import type { Prisma } from "@prisma/client";
import prisma from "../../../database/database.config.js";
import { opportunityClubV2Include } from "./types.js";

export class OpportunityClubV2Repository {
  async getAll() {
    return prisma.opportunityClubV2.findMany({
      include: opportunityClubV2Include,
      orderBy: { createdAt: "asc" },
    });
  }

  async getById(id: string) {
    return prisma.opportunityClubV2.findUnique({
      where: { id },
      include: opportunityClubV2Include,
    });
  }

  async create(data: Prisma.OpportunityClubV2UncheckedCreateInput) {
    return prisma.opportunityClubV2.create({
      data,
      include: opportunityClubV2Include,
    });
  }
}

export type OpportunityClubV2Row = Awaited<
  ReturnType<OpportunityClubV2Repository["getAll"]>
>[number];
