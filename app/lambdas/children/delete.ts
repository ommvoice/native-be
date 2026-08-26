import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { WishlistService } from '../../services/wishlist.service';
import { errorHandler } from '../../shared/middleware/error-handler';
import { AppError } from '../../shared/errors/app-error';
import { noContent } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.['id'];
  if (!id) throw new AppError(400, 'id path parameter is required');

  const service = new ChildService(new ChildRepository(), new InterestRepository(), new ParentRepository(), new WishlistService());
  await service.delete(id);
  return noContent();
};

export const handler = middy(baseHandler)
  .use(errorHandler());
