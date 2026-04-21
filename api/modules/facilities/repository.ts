import prisma from "../../database/database.config.js";

export class FacilitiesRepository {
  getAll() {
    return prisma.facility.findMany({
      orderBy: [{ type: "asc" }, { slug: "asc" }],
    });
  }
}
