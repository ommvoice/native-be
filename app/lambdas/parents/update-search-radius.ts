import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ParentService } from '../../services/parent.service';
import { ParentRepository } from '../../repositories/parent.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { updateSearchRadiusSchema } from '../../schemas/parent.schema';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id             = event.pathParameters?.['id']!;
  const { searchRadius } = event.body as unknown as { searchRadius: number };
  const service        = new ParentService(new ParentRepository(), new InterestRepository());
  return ok(await service.updateSearchRadius(id, searchRadius));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(updateSearchRadiusSchema))
  .use(errorHandler());
