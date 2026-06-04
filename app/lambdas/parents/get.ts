import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ParentService } from '../../services/parent.service';
import { ParentRepository } from '../../repositories/parent.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id      = event.pathParameters?.['id']!;
  const service = new ParentService(new ParentRepository(), new InterestRepository());
  return ok(await service.getById(id));
};

export const handler = middy(baseHandler)
  .use(errorHandler());
