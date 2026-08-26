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
import type { CreateChildDto } from '../../dtos/child.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto     = event.body as unknown as CreateChildDto;
  const service = new ChildService(new ChildRepository(), new InterestRepository(), new ParentRepository(), new WishlistService());
  const child   = await service.create(dto);
  return created({ ids: [child.id] });
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(createChildSchema))
  .use(errorHandler());
