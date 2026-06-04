import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecommendationV2Service } from '../../services/recommendation-v2.service';
import { errorHandler } from '../../shared/middleware/error-handler';
import { AppError } from '../../shared/errors/app-error';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId = event.queryStringParameters?.['parentId'];
  const childId  = event.queryStringParameters?.['childId'];
  if (!parentId) throw new AppError(400, 'parentId query parameter is required');

  const service = new RecommendationV2Service();
  return ok(await service.getRecommendations({ parentId, childId }));
};

export const handler = middy(baseHandler)
  .use(errorHandler());
