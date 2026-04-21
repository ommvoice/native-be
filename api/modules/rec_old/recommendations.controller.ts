import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { RecommendationsService } from "./recommendations.service.js";
import type { RecommendationRequestDto } from "./recommendations.dto.js";

export class RecommendationsController {
  constructor(private service: RecommendationsService) {}

  getRecommendations = async (req: Request, res: Response): Promise<void> => {
    const { parentId } = req.params;
    const { latitude, categories } = req.query;

    const dto: RecommendationRequestDto = {
      parentId: parentId!,
      latitude: Number(latitude),
      categories: categories ? String(categories).split(",") : undefined,
    };

    const results = await this.service.getRecommendations(dto);
    res.status(StatusCodes.OK).json({ count: results.length, data: results });
  };
}
