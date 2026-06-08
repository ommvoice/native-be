import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { RecommendationQueryDto } from "./dto.js";
import type { RecommendationsService } from "./service.js";
import type { EnrichedScoredRecommendation } from "./types.js";

function recommendationDtoFromRequest(req: Request, parentId: string): RecommendationQueryDto {
  const { childId } = req.query;

  const dto: RecommendationQueryDto = { parentId };
  if (typeof childId === "string" && childId) dto.childId = childId;
  return dto;
}

export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  getForParent = async (req: Request, res: Response): Promise<void> => {
    const parentId = req.params.parentId;
    if (typeof parentId !== "string") {
      res.status(400).json({ message: "Invalid parent id." });
      return;
    }
    const dto = recommendationDtoFromRequest(req, parentId);
    const data: EnrichedScoredRecommendation[] = await this.service.getRecommendationsForParent(dto);
    res.status(StatusCodes.OK).json({ count: data.length, data });
  };

  getNearbyForParent = async (req: Request, res: Response): Promise<void> => {
    const parentId = req.params.parentId;
    if (typeof parentId !== "string") {
      res.status(400).json({ message: "Invalid parent id." });
      return;
    }
    const dto = recommendationDtoFromRequest(req, parentId);
    const data: EnrichedScoredRecommendation[] =
      await this.service.getRecommendationsForParentNearby(dto);
    res.status(StatusCodes.OK).json({ count: data.length, data, mode: "nearby" });
  };

  getForFamily = async (req: Request, res: Response): Promise<void> => {
    const parentId = req.params.parentId;
    if (typeof parentId !== "string") {
      res.status(400).json({ message: "Invalid parent id." });
      return;
    }
    const data: EnrichedScoredRecommendation[] = await this.service.getRecommendationsForFamily(parentId);
    res.status(StatusCodes.OK).json({ count: data.length, data, scope: "family" });
  };

  getForParentAndChild = async (req: Request, res: Response): Promise<void> => {
    const parentId = req.params.parentId;
    const childId = req.params.childId;
    if (typeof parentId !== "string" || typeof childId !== "string") {
      res.status(400).json({ message: "Invalid parent id or child id." });
      return;
    }
    const data: EnrichedScoredRecommendation[] =
      await this.service.getRecommendationsForParentAndChild(parentId, childId);
    res.status(StatusCodes.OK).json({ count: data.length, data, scope: "parent_and_child", childId });
  };
}
