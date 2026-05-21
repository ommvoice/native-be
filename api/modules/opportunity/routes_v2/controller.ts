import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityRouteV2Service } from "./service.js";
import type { CreateOpportunityRouteV2Body } from "./schema.js";

export class OpportunityRouteV2Controller {
  constructor(private routeV2Service: OpportunityRouteV2Service) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const rows = await this.routeV2Service.getAll();
    res.status(StatusCodes.OK).json(rows);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const row = await this.routeV2Service.getById(id as string);
    res.status(StatusCodes.OK).json(row);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityRouteV2Body;
    const row = await this.routeV2Service.create(payload);
    res.status(StatusCodes.CREATED).json(row);
  };
}
