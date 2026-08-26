import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OnboardParentService } from '../../services/onboard-parent.service';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { ChildRepository } from '../../repositories/child.repository';
import { WishlistService } from '../../services/wishlist.service';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { onboardParentSchema } from '../../schemas/onboard.schema';
import { created } from '../../shared/utils/response';
import type { OnboardParentDto } from '../../dtos/onboard.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto     = event.body as unknown as OnboardParentDto;
  const service = new OnboardParentService(
    new AuthService(new UserRepository()),
    new ParentRepository(),
    new ChildRepository(),
    new WishlistService(),
  );
  return created(await service.create(dto));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(onboardParentSchema))
  .use(errorHandler());
