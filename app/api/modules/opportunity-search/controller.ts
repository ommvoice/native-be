import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  OPPORTUNITY_SEARCH_QUERY_LOCAL_KEY,
  type OpportunitySearchQueryValidated,
} from "./schema.js";
import type { OpportunitySearchService } from "./service.js";

export class OpportunitySearchController {
  constructor(private readonly service: OpportunitySearchService) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const q = (res.locals as Record<string, OpportunitySearchQueryValidated>)[
      OPPORTUNITY_SEARCH_QUERY_LOCAL_KEY
    ]!;
    const data = await this.service.search({
      parentId: q.parentId,
      ...(q.interestSubCategorySlug != null && {
        interestSubCategorySlug: q.interestSubCategorySlug,
      }),
      ...(q.maxTimeToReachMinutes != null && {
        maxTimeToReachMinutes: q.maxTimeToReachMinutes,
      }),
      ...(q.maxDistanceMiles != null && { maxDistanceMiles: q.maxDistanceMiles }),
      ...(q.childId != null && { childId: q.childId }),
      ...(q.facility != null &&
        q.facility.length > 0 && { facility: q.facility }),
    });
    res.status(StatusCodes.OK).json({ count: data.length, data });
  };
}
