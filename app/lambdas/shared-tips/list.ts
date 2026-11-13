import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SharedTipService } from '../../services/shared-tip.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { getAuthUser } from '../../shared/middleware/auth-guard.js';
import { ok } from '../../shared/utils/response.js';

/** GET /shared-tips — the signed-in parent's own tips (photos as short-lived photoViewUrl links). */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sub } = getAuthUser(event);
  const data = await new SharedTipService().listMine(sub);
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
