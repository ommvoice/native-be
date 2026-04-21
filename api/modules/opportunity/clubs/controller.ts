import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityClubService } from "./service.js";
import type { CreateOpportunityClubBody } from "./schema.js";

export class OpportunityClubController {
  constructor(private clubService: OpportunityClubService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const clubs = await this.clubService.getAll();
    res.status(StatusCodes.OK).json(clubs);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const club = await this.clubService.getById(id as string);
    res.status(StatusCodes.OK).json(club);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityClubBody;
    const club = await this.clubService.create(payload);
    res.status(StatusCodes.CREATED).json(club);
  };
}
