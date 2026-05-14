import type { ROLE } from "@prisma/client";
import prisma from "../../database/database.config.js";

export class UserRepository {
  async getById(id: string) {
    return prisma.users.findUnique({
      where: { id },
    });
  }

  async getByEmail(email: string) {
    return prisma.users.findUnique({
      where: { email },
    });
  }

  async create(email: string, role: ROLE, sub: string): Promise<string> {
    const entity = await prisma.users.create({
      data: {
        email,
        role,
        sub,
      },
    });

    return entity.id;
  }

  async upsertBySub(sub: string, email: string) {
    return prisma.users.upsert({
      where: { sub },
      update: { email },
      create: { sub, email, role: "PARENT" },
      select: { id: true, email: true, role: true, sub: true },
    });
  }

  async getBySub(sub: string) {
    return prisma.users.findUnique({ where: { sub } });
  }
}
