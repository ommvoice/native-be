import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecommendationV2Service } from '../../services/recommendation-v2.service.js';
import { toOpportunityList } from '../../shared/utils/formatter/recommendation-formatter.js';
import { groupOpportunitiesByInterest } from '../../shared/utils/formatter/plan-formatter.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ok } from '../../shared/utils/response.js';
import { getInitialScore } from '../../services/scoring-v2.service.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId     = event.queryStringParameters?.['parentId'];
  const childId      = event.queryStringParameters?.['childId'];
  const searchRadius = event.queryStringParameters?.['searchRadius'];
  if (!parentId) throw new AppError(400, 'parentId query parameter is required');

  const service = new RecommendationV2Service();
  // Everything Local tab — every scoring dimension is skipped, so this is the
  // full local opportunity pool, unranked/unfiltered by interests, age,
  // weather, schedule or distance, just grouped by interest for display.
  const skipRecommendations = getInitialScore({ skipAll: true });
  const { data: raw, childrenAges } = await service.getRecommendations2({ parentId, childId, searchRadius }, skipRecommendations);
  const opportunities = toOpportunityList(raw as any, childrenAges);
  const data = groupOpportunitiesByInterest(opportunities);
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
