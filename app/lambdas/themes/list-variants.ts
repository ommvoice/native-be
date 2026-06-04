import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ThemeRepository } from '../../repositories/theme.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const themeId = event.queryStringParameters?.['themeId'];
  return ok(await new ThemeRepository().listVariants(themeId));
};

export const handler = middy(baseHandler)
  .use(errorHandler());
