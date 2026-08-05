import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecommendationV2Service } from '../../services/recommendation-v2.service.js';
import { toOpportunityList } from '../../shared/utils/formatter/recommendation-formatter.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ok } from '../../shared/utils/response.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId = event.queryStringParameters?.['parentId'];
  const childId  = event.queryStringParameters?.['childId'];
  const opportunityLat  = event.queryStringParameters?.['opportunityLat'];
  const opportunityLong  = event.queryStringParameters?.['opportunityLong'];

  if (!parentId) throw new AppError(400, 'parentId query parameter is required');

  const service = new RecommendationV2Service();
  const { data: raw, childrenAges } = await service.getNearby({ parentId, childId, opportunityLat,  opportunityLong });
  const data = toOpportunityList(raw as any, childrenAges);
  return ok({ count: data.length, data, mode: 'nearby' });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
