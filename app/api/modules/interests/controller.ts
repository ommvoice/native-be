import type { Request, Response } from "express";
import type { InterestService } from "./service.js";

export class InterestController {
  constructor(private interestService: InterestService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const interests = await this.interestService.getAll();
    res.status(200).json(interests);
  };
}
