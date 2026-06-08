import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityVenueV2Repository } from "./repository.js";
import type { CreateOpportunityVenueV2Body } from "./schema.js";
import type { OpportunityVenueV2Response } from "./types.js";

export class OpportunityVenueV2Service {
  constructor(private repository: OpportunityVenueV2Repository) {}

  async getAll(): Promise<OpportunityVenueV2Response[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<OpportunityVenueV2Response> {
    const row = await this.repository.getById(id);
    if (!row) throw new AppError(404, "Opportunity event (v2) not found");
    return row;
  }

  async create(data: CreateOpportunityVenueV2Body): Promise<OpportunityVenueV2Response> {
    return this.repository.create(data);
  }
}
