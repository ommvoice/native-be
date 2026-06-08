import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityEventRepository } from "./repository.js";
import type { CreateOpportunityEventBody } from "./schema.js";
import type { OpportunityEventResponse } from "./types.js";
import { enrichOpportunityEventResponse } from "./helpers.js";

export class OpportunityEventService {
  constructor(private repository: OpportunityEventRepository) {}

  async getAll(): Promise<OpportunityEventResponse[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityEventResponse);
  }

  async getById(id: string): Promise<OpportunityEventResponse> {
    const event = await this.repository.getById(id);
    if (!event) throw new AppError(404, "Opportunity event not found");
    return enrichOpportunityEventResponse(event);
  }

  async create(
    data: CreateOpportunityEventBody,
  ): Promise<OpportunityEventResponse> {
    const created = await this.repository.create(data);
    return enrichOpportunityEventResponse(created);
  }
}
