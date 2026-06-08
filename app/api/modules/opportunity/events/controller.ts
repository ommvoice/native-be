import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityEventService } from "./service.js";
import type { CreateOpportunityEventBody } from "./schema.js";

export class OpportunityEventController {
  constructor(private eventService: OpportunityEventService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const events = await this.eventService.getAll();
    res.status(StatusCodes.OK).json(events);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const event = await this.eventService.getById(id as string);
    res.status(StatusCodes.OK).json(event);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityEventBody;
    const event = await this.eventService.create(payload);
    res.status(StatusCodes.CREATED).json(event);
  };
}
