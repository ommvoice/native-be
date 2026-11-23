import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WishlistService } from '../../services/wishlist.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { AppError } from '../../shared/errors/app-error.js';
import { noContent } from '../../shared/utils/response.js';
import { resolveParentId } from '../../shared/auth/current-parent.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.['id'];
  if (!id) throw new AppError(400, 'id path parameter is required');

  const parentId = await resolveParentId(event);
  await new WishlistService().delete(id, parentId);
  return noContent();
};

export const handler = middy(baseHandler)
  .use(errorHandler());
