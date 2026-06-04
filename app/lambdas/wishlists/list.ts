import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WishlistService } from '../../services/wishlist.service';
import { authGuard } from '../../shared/middleware/auth-guard';
import { queryValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { getWishlistsQuerySchema } from '../../schemas/wishlist.schema';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId = event.queryStringParameters?.['parentId']!;
  return ok(await new WishlistService().list({ parentId }));
};

export const handler = middy(baseHandler)
  .use(authGuard())
  .use(queryValidator(getWishlistsQuerySchema))
  .use(errorHandler());
