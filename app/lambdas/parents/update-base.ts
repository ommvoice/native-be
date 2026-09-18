import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ParentService } from '../../services/parent.service';
import { ParentRepository } from '../../repositories/parent.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { updateParentBaseSchema } from '../../schemas/parent.schema';
import { ok } from '../../shared/utils/response';
import { ChildRepository } from '../../repositories/child.repository';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id             = event.pathParameters?.['id']!;
  const { baseId, serviceBranch } = event.body as unknown as { baseId: string; serviceBranch: string };
  const service        = new ParentService(new ParentRepository(), new InterestRepository(), new ChildRepository());
  return ok(await service.updateBase(id, baseId, serviceBranch));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(updateParentBaseSchema))
  .use(errorHandler());
