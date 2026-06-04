import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { authGuard } from '../../shared/middleware/auth-guard';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { updateChildInterestsSchema } from '../../schemas/child.schema';
import { ok } from '../../shared/utils/response';
import type { UpdateChildInterestsDto } from '../../dtos/child.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id      = event.pathParameters?.['id']!;
  const dto     = event.body as unknown as UpdateChildInterestsDto;
  const service = new ChildService(new ChildRepository());
  return ok(await service.updateInterests(id, dto.interestCategoryIds, dto.interestSubCategoryIds));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(authGuard())
  .use(bodyValidator(updateChildInterestsSchema))
  .use(errorHandler());
