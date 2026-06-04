import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InterestRepository } from '../../repositories/interest.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const categories = await new InterestRepository().listCategories();
  return ok(categories);
};

export const handler = middy(baseHandler)
  .use(errorHandler());
