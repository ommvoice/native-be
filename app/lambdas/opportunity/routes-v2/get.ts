import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OpportunityV2Repository } from '../../../repositories/opportunity-v2.repository';
import { routeToOpportunity } from '../../../shared/utils/formatter/route-to-opportunity';
import { errorHandler } from '../../../shared/middleware/error-handler';
import { AppError } from '../../../shared/errors/app-error';
import { ok } from '../../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id   = event.pathParameters?.['id']!;
  const item = await new OpportunityV2Repository().getRoute(id);
  if (!item) throw new AppError(404, 'Route not found');
  return ok(routeToOpportunity(item));
};

export const handler = middy(baseHandler).use(errorHandler());
