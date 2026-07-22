import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InterestRepository } from '../../repositories/interest.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const categorySlug = event.queryStringParameters?.['categorySlug'];
  const subCats      = await new InterestRepository().listSubCategories(categorySlug);
  return ok(subCats);
};

export const handler = middy(baseHandler)
  .use(errorHandler());
