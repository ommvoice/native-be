import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecommendationV2Service } from '../../services/recommendation-v2.service.js';
import { toOpportunityList } from '../../shared/utils/formatter/recommendation-formatter.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { ok } from '../../shared/utils/response.js';
import { AppError } from '../../shared/errors/app-error.js';
import { getInitialScore } from '../../services/scoring-v2.service.js';
import { resolveParentId } from '../../shared/auth/current-parent.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId     = await resolveParentId(event, event.queryStringParameters?.['parentId']);
  const childId      = event.queryStringParameters?.['childId'];
  const searchRadius = event.queryStringParameters?.['searchRadius'];
  // Whole-family list: the profiles ticked in "Have We Got Everyone" (comma list; the parent always counts).
  const memberIds    = event.queryStringParameters?.['memberIds'];

  // Comma list of family member ids — a family is never this big; bounds the per-request work.
  if ((memberIds ?? '').split(',').length > 20) throw new AppError(400, 'memberIds has too many ids');

  const service = new RecommendationV2Service();
  // const { data: raw, childrenAges } = await service.getRecommendations({ parentId, childId, searchRadius });
  const skipRecommendations = getInitialScore({
    // skipWeather: true
  });
  const { data: raw, childrenAges } = await service.getRecommendations2({ parentId, childId, searchRadius, memberIds }, skipRecommendations);
  const data = toOpportunityList(raw as any, childrenAges);
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
