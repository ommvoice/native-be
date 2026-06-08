import AppError from "../../../shared/errors/AppError.js";
import type { OpportunityRouteRepository } from "./repository.js";
import type { CreateOpportunityRouteBody } from "./schema.js";
import type { OpportunityRouteResponse } from "./types.js";
import { enrichOpportunityRouteResponse } from "./helpers.js";

export class OpportunityRouteService {
  constructor(private repository: OpportunityRouteRepository) {}

  async getAll(): Promise<OpportunityRouteResponse[]> {
    const rows = await this.repository.getAll();
    return rows.map(enrichOpportunityRouteResponse);
  }

  async getById(id: string): Promise<OpportunityRouteResponse> {
    const route = await this.repository.getById(id);
    if (!route) throw new AppError(404, "Opportunity route not found");
    return enrichOpportunityRouteResponse(route);
  }

  async create(data: CreateOpportunityRouteBody): Promise<OpportunityRouteResponse> {
    const created = await this.repository.create(data);
    return enrichOpportunityRouteResponse(created);
  }
}
