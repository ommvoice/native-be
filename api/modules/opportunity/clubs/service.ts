import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityClubRepository } from "./repository.js";
import type { CreateOpportunityClubBody } from "./schema.js";
import type { OpportunityClubResponse } from "./types.js";
import { enrichOpportunityClubResponse } from "./helpers.js";

export class OpportunityClubService {
  constructor(private repository: OpportunityClubRepository) {}

  async getAll(): Promise<OpportunityClubResponse[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityClubResponse);
  }

  async getById(id: string): Promise<OpportunityClubResponse> {
    const club = await this.repository.getById(id);
    if (!club) throw new AppError(404, "Opportunity club not found");
    return enrichOpportunityClubResponse(club);
  }

  async create(data: CreateOpportunityClubBody): Promise<OpportunityClubResponse> {
    const created = await this.repository.create(data);
    return enrichOpportunityClubResponse(created);
  }
}
