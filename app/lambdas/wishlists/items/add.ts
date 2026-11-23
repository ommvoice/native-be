import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WishlistService } from '../../../services/wishlist.service.js';
import { errorHandler } from '../../../shared/middleware/error-handler.js';
import { bodyValidator } from '../../../shared/middleware/body-validator.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { created } from '../../../shared/utils/response.js';
import { addWishlistItemSchema } from '../../../schemas/wishlist.schema.js';
import type { AddWishlistItemDto } from '../../../dtos/wishlist.dto';
import { resolveParentId } from '../../../shared/auth/current-parent.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const wishlistId = event.pathParameters?.['id'];
  if (!wishlistId) throw new AppError(400, 'id path parameter is required');

  const dto = event.body as unknown as AddWishlistItemDto;
  const item = await new WishlistService().addItem(wishlistId, dto, await resolveParentId(event));
  return created(item);
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(addWishlistItemSchema))
  .use(errorHandler());
