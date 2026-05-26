import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { RecommendationQueryDto } from "./dto.js";
import type { RecommendationsV2Service } from "./service.js";
import type { EnrichedScoredRecommendationV2 } from "./types.js";
import { toOpportunityList } from "../../shared/utils/formatter/index.js";

function recommendationDtoFromRequest(req: Request, parentId: string): RecommendationQueryDto {
  const { childId } = req.query;

  const dto: RecommendationQueryDto = { parentId };
  if (typeof childId === "string" && childId) dto.childId = childId;
  return dto;
}

export class RecommendationsV2Controller {
  constructor(private readonly service: RecommendationsV2Service) {}

  getForParent = async (req: Request, res: Response): Promise<void> => {
    const parentId = req.params.parentId;
    if (typeof parentId !== "string") {
      res.status(400).json({ message: "Invalid parent id." });
      return;
    }
    const dto = recommendationDtoFromRequest(req, parentId);
    const recommendations: EnrichedScoredRecommendationV2[] = await this.service.getRecommendationsForParent(dto);
    const data= toOpportunityList(recommendations);

    console.log(`yy `);
    res.status(StatusCodes.OK).json({ count: data.length, data });
  };

  getForParentAndChild = async (req: Request, res: Response): Promise<void> => {
    const parentId = req.params.parentId;
    const childId = req.params.childId;
    if (typeof parentId !== "string" || typeof childId !== "string") {
      res.status(400).json({ message: "Invalid parent id or child id." });
      return;
    }
    const recommendations: EnrichedScoredRecommendationV2[] =
      await this.service.getRecommendationsForParentAndChild(parentId, childId);
    const data= toOpportunityList(recommendations);

    res.status(StatusCodes.OK).json({ count: data.length, data, scope: "parent_and_child", childId });
  };
}
