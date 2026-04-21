import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityVenueRepository } from "./repository.js";
import type { CreateOpportunityVenueBody } from "./schema.js";
import type { OpportunityVenueResponse } from "./types.js";
import { enrichOpportunityVenueResponse } from "./helpers.js";

export class OpportunityVenueService {
  constructor(private repository: OpportunityVenueRepository) {}

  async getAll(): Promise<OpportunityVenueResponse[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityVenueResponse);
  }

  async getById(id: string): Promise<OpportunityVenueResponse> {
    const venue = await this.repository.getById(id);
    if (!venue) throw new AppError(404, "Opportunity venue not found");
    return enrichOpportunityVenueResponse(venue);
  }

  async create(data: CreateOpportunityVenueBody): Promise<OpportunityVenueResponse> {
    const created = await this.repository.create(data);
    return enrichOpportunityVenueResponse(created);
  }
}
