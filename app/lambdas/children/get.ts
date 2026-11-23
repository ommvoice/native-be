import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { WishlistService } from '../../services/wishlist.service';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';
import { resolveParentId } from '../../shared/auth/current-parent';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id      = event.pathParameters?.['id']!;
  const parentId = await resolveParentId(event);
  const service = new ChildService(new ChildRepository(), new InterestRepository(), new ParentRepository(), new WishlistService());
  return ok(await service.getById(id, parentId));
};

export const handler = middy(baseHandler)
  .use(errorHandler());
