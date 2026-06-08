import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { updateChildSchema } from '../../schemas/child.schema';
import { ok } from '../../shared/utils/response';
import type { UpdateChildDto } from '../../dtos/child.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id      = event.pathParameters?.['id']!;
  const dto     = event.body as unknown as UpdateChildDto;
  const service = new ChildService(new ChildRepository(), new InterestRepository(), new ParentRepository());
  return ok(await service.update(id, dto));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(updateChildSchema))
  .use(errorHandler());
