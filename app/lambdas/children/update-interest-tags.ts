import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { WishlistService } from '../../services/wishlist.service';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { updateChildInterestTagsSchema } from '../../schemas/child.schema';
import { ok } from '../../shared/utils/response';
import type { UpdateChildInterestTagsDto } from '../../dtos/child.dto';
import { resolveParentId } from '../../shared/auth/current-parent';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id      = event.pathParameters?.['id']!;
  const parentId = await resolveParentId(event);
  const dto     = event.body as unknown as UpdateChildInterestTagsDto;
  const service = new ChildService(new ChildRepository(), new InterestRepository(), new ParentRepository(), new WishlistService());
  return ok(await service.updateInterestTags(id, dto.interestTags, parentId));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(updateChildInterestTagsSchema))
  .use(errorHandler());
