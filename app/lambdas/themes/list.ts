import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ThemeRepository } from '../../repositories/theme.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return ok(await new ThemeRepository().listThemes());
};

export const handler = middy(baseHandler)
  .use(errorHandler());
