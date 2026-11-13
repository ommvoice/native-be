import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SharedTipService } from '../../services/shared-tip.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { bodyValidator } from '../../shared/middleware/body-validator.js';
import { getAuthUser } from '../../shared/middleware/auth-guard.js';
import { created } from '../../shared/utils/response.js';
import { createSharedTipSchema } from '../../schemas/shared-tip.schema.js';
import type { CreateSharedTipDto } from '../../dtos/shared-tip.dto';

/** POST /shared-tips — store a Share A Tip submission (parent resolved from the auth token). */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sub } = getAuthUser(event);
  const dto = event.body as unknown as CreateSharedTipDto;
  return created(await new SharedTipService().create(sub, dto));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(createSharedTipSchema))
  .use(errorHandler());
