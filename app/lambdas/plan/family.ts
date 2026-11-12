import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecommendationV2Service } from '../../services/recommendation-v2.service.js';
import { toOpportunityList } from '../../shared/utils/formatter/recommendation-formatter.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ok } from '../../shared/utils/response.js';
import { getInitialScore } from '../../services/scoring-v2.service.js';
import { PlanService } from '../../services/plan.service.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId     = event.queryStringParameters?.['parentId'];
  const childId      = event.queryStringParameters?.['childId'];
  const searchRadius = event.queryStringParameters?.['searchRadius'];
  if (!parentId) throw new AppError(400, 'parentId query parameter is required');

  const service = new RecommendationV2Service();
  const planService = new PlanService();

  const skipRecommendations = getInitialScore({
    // skipAges:true,
    skipSchedule: true,
    skipWeather: true,
    skipDistance: true,
  });
  const { data: raw, childrenAges } = await service.getRecommendations2({ parentId, childId, searchRadius }, skipRecommendations);
  
  const opportunities = toOpportunityList(raw as any, childrenAges);

  const data = await planService.getSingleFamilyMemberRecommendations({parentId, childId}, opportunities);

  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
