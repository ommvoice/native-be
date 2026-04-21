import type { Request, Response } from "express";
import type { RequestChildrenCreateDto } from "./dto.js";
import { StatusCodes } from "http-status-codes";
import type { ChildrenService } from "./service.js";
import type { UpdateInterestPreferencesBody } from "../parents/schema.js";

export class ChildrenController {
  constructor(private childrenService: ChildrenService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as RequestChildrenCreateDto;

    const ids = await this.childrenService.create(payload);
    res.status(StatusCodes.CREATED).json({ ids });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const child = await this.childrenService.getById(id as string);
    res.status(StatusCodes.OK).json(child);
  };

  updateInterestPreferences = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { interestCategoryIds, interestSubCategoryIds } =
      req.body as UpdateInterestPreferencesBody;

    const child = await this.childrenService.updateInterestPreferences(
      id as string,
      interestCategoryIds,
      interestSubCategoryIds,
    );
    res.status(StatusCodes.OK).json(child);
  };
}
