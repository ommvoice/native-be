import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityClubV2Repository } from "./repository.js";
import type { CreateOpportunityClubV2Body } from "./schema.js";
import type { OpportunityClubV2Response } from "./types.js";

export class OpportunityClubV2Service {
  constructor(private repository: OpportunityClubV2Repository) {}

  async getAll(): Promise<OpportunityClubV2Response[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<OpportunityClubV2Response> {
    const row = await this.repository.getById(id);
    if (!row) throw new AppError(404, "Opportunity club (v2) not found");
    return row;
  }

  async create(data: CreateOpportunityClubV2Body): Promise<OpportunityClubV2Response> {
    return this.repository.create(data);
  }
}
