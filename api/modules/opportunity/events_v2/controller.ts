import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityVenueV2Service } from "./service.js";
import type { CreateOpportunityVenueV2Body } from "./schema.js";

export class OpportunityVenueV2Controller {
  constructor(private venueV2Service: OpportunityVenueV2Service) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const rows = await this.venueV2Service.getAll();
    res.status(StatusCodes.OK).json(rows);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const row = await this.venueV2Service.getById(id as string);
    res.status(StatusCodes.OK).json(row);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityVenueV2Body;
    const row = await this.venueV2Service.create(payload);
    res.status(StatusCodes.CREATED).json(row);
  };
}
