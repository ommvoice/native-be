import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { authGuard } from '../../shared/middleware/auth-guard';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id      = event.pathParameters?.['id']!;
  const service = new ChildService(new ChildRepository());
  return ok(await service.getById(id));
};

export const handler = middy(baseHandler)
  .use(authGuard())
  .use(errorHandler());
