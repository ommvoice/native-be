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
import { createChildSchema } from '../../schemas/child.schema';
import { created } from '../../shared/utils/response';
import type { CreateGuestChildDto } from '../../dtos/child.dto';

// "Include someone extra today" — same body/validation as POST /children, but always created as a
// same-day guest (variant: 'guest', expireDate: today). See ChildService.createGuest().
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto     = event.body as unknown as CreateGuestChildDto;
  const service = new ChildService(new ChildRepository(), new InterestRepository(), new ParentRepository(), new WishlistService());
  const child   = await service.createGuest(dto);
  return created({ ids: [child.id] });
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(createChildSchema))
  .use(errorHandler());
