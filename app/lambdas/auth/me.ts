import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { getAuthUser } from '../../shared/middleware/auth-guard';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sub }  = getAuthUser(event);
  const service  = new AuthService(new UserRepository());
  const user     = await service.me(sub);
  return ok(user);
};

export const handler = middy(baseHandler)
  .use(errorHandler());
