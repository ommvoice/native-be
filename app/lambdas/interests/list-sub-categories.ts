import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InterestRepository } from '../../repositories/interest.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const categoryId = event.queryStringParameters?.['categoryId'];
  const subCats    = await new InterestRepository().listSubCategories(categoryId);
  return ok(subCats);
};

export const handler = middy(baseHandler)
  .use(errorHandler());
