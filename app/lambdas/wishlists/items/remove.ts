import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WishlistService } from '../../../services/wishlist.service.js';
import { errorHandler } from '../../../shared/middleware/error-handler.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { noContent } from '../../../shared/utils/response.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const itemId = event.pathParameters?.['itemId'];
  if (!itemId) throw new AppError(400, 'itemId path parameter is required');

  await new WishlistService().removeItem(decodeURIComponent(itemId));
  return noContent();
};

export const handler = middy(baseHandler)
  .use(errorHandler());
