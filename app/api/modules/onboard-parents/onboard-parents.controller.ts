import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { OnboardParentService } from "./onboard-parents.service.js";
import type { RequestOnboardParentCreateDto } from "./onboard-parents.dto.js";

export class OnboardParentController {
  constructor(private onboardParentService: OnboardParentService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as RequestOnboardParentCreateDto;

    const result = await this.onboardParentService.create(payload);
    res.status(StatusCodes.CREATED).json(result);
  };
}
