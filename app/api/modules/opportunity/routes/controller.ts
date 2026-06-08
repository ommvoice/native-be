import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityRouteService } from "./service.js";
import type { CreateOpportunityRouteBody } from "./schema.js";

export class OpportunityRouteController {
  constructor(private routeService: OpportunityRouteService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const routes = await this.routeService.getAll();
    res.status(StatusCodes.OK).json(routes);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const route = await this.routeService.getById(id as string);
    res.status(StatusCodes.OK).json(route);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityRouteBody;
    const route = await this.routeService.create(payload);
    res.status(StatusCodes.CREATED).json(route);
  };
}
