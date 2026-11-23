import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WishlistService } from '../../../services/wishlist.service.js';
import { errorHandler } from '../../../shared/middleware/error-handler.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { ok } from '../../../shared/utils/response.js';
import { resolveParentId } from '../../../shared/auth/current-parent.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const wishlistId = event.pathParameters?.['id'];
  if (!wishlistId) throw new AppError(400, 'id path parameter is required');

  const data = await new WishlistService().getEnrichedItems(wishlistId, await resolveParentId(event));
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
