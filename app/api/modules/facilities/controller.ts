import type { Request, Response } from "express";
import type { FacilitiesService } from "./service.js";

export class FacilitiesController {
  constructor(private facilitiesService: FacilitiesService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const facilities = await this.facilitiesService.getAll();
    res.status(200).json(facilities);
  };
}
