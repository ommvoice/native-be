import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AllOpportunitiesService } from "./service.js";

export class AllOpportunitiesController {
  constructor(private allService: AllOpportunitiesService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const payload = await this.allService.getAll();
    res.status(StatusCodes.OK).json(payload);
  };
}
