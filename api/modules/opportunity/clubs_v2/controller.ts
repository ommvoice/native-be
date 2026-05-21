import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OpportunityClubV2Service } from "./service.js";
import type { CreateOpportunityClubV2Body } from "./schema.js";

export class OpportunityClubV2Controller {
  constructor(private clubV2Service: OpportunityClubV2Service) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const rows = await this.clubV2Service.getAll();
    res.status(StatusCodes.OK).json(rows);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const row = await this.clubV2Service.getById(id as string);
    res.status(StatusCodes.OK).json(row);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as CreateOpportunityClubV2Body;
    const row = await this.clubV2Service.create(payload);
    res.status(StatusCodes.CREATED).json(row);
  };
}
