import type { Request, Response } from "express";
import type { ParentService } from "./service.js";
import type { UpdateInterestPreferencesBody } from "./schema.js";

export class ParentController {
  constructor(private parentService: ParentService) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const parent = await this.parentService.getById(id as string);
    res.status(200).json(parent);
  };

  updateSearchRadius = async (req: Request, res: Response): Promise<void> => {
    const { id, searchRadius } = req.params;

    const parent = await this.parentService.updateSearchRadius(
      id as string,
      Number(searchRadius),
    );
    res.status(200).json(parent);
  };

  updateInterestPreferences = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { interestCategoryIds, interestSubCategoryIds } =
      req.body as UpdateInterestPreferencesBody;

    const parent = await this.parentService.updateInterestPreferences(
      id as string,
      interestCategoryIds,
      interestSubCategoryIds,
    );
    res.status(200).json(parent);
  };
}
