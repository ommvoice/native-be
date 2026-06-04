import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { authGuard } from '../../shared/middleware/auth-guard';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { createChildSchema } from '../../schemas/child.schema';
import { created } from '../../shared/utils/response';
import type { CreateChildDto } from '../../dtos/child.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto     = event.body as unknown as CreateChildDto;
  const service = new ChildService(new ChildRepository());
  return created(await service.create(dto));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(authGuard())
  .use(bodyValidator(createChildSchema))
  .use(errorHandler());
