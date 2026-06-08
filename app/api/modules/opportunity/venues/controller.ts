import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityVenueService } from "./service.js";
import type { CreateOpportunityVenueBody } from "./schema.js";

export class OpportunityVenueController {
  constructor(private venueService: OpportunityVenueService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const venues = await this.venueService.getAll();
    res.status(StatusCodes.OK).json(venues);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const venue = await this.venueService.getById(id as string);
    res.status(StatusCodes.OK).json(venue);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityVenueBody;
    const venue = await this.venueService.create(payload);
    res.status(StatusCodes.CREATED).json(venue);
  };
}
