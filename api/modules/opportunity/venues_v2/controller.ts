import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityVenuesV2Service } from "./service.js";
import type { CreateOpportunityVenuesV2Body } from "./schema.js";

export class OpportunityVenuesV2Controller {
  constructor(private venuesV2Service: OpportunityVenuesV2Service) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const venues = await this.venuesV2Service.getAll();
    res.status(StatusCodes.OK).json(venues);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const venue = await this.venuesV2Service.getById(id as string);
    res.status(StatusCodes.OK).json(venue);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityVenuesV2Body;
    const venue = await this.venuesV2Service.create(payload);
    res.status(StatusCodes.CREATED).json(venue);
  };
}
