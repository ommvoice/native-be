import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { WishlistService } from '../../services/wishlist.service';
import { authGuard } from '../../shared/middleware/auth-guard';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { createWishlistSchema } from '../../schemas/wishlist.schema';
import { created } from '../../shared/utils/response';
import type { CreateWishlistDto } from '../../dtos/wishlist.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto = event.body as unknown as CreateWishlistDto;
  return created(await new WishlistService().create(dto));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(authGuard())
  .use(bodyValidator(createWishlistSchema))
  .use(errorHandler());
