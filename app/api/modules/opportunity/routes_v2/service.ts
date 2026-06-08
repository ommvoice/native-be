import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityRouteV2Repository } from "./repository.js";
import type { CreateOpportunityRouteV2Body } from "./schema.js";
import type { OpportunityRouteV2Response } from "./types.js";

export class OpportunityRouteV2Service {
  constructor(private repository: OpportunityRouteV2Repository) {}

  async getAll(): Promise<OpportunityRouteV2Response[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<OpportunityRouteV2Response> {
    const row = await this.repository.getById(id);
    if (!row) throw new AppError(404, "Opportunity route (v2) not found");
    return row;
  }

  async create(data: CreateOpportunityRouteV2Body): Promise<OpportunityRouteV2Response> {
    return this.repository.create(data);
  }
}
