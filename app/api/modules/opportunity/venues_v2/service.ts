import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityVenuesV2Repository } from "./repository.js";
import type { CreateOpportunityVenuesV2Body } from "./schema.js";
import type { OpportunityVenuesV2Response } from "./types.js";

export class OpportunityVenuesV2Service {
  constructor(private repository: OpportunityVenuesV2Repository) {}

  async getAll(): Promise<OpportunityVenuesV2Response[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<OpportunityVenuesV2Response> {
    const row = await this.repository.getById(id);
    if (!row) throw new AppError(404, "Opportunity venue (v2) not found");
    return row;
  }

  async create(data: CreateOpportunityVenuesV2Body): Promise<OpportunityVenuesV2Response> {
    return this.repository.create(data);
  }
}
