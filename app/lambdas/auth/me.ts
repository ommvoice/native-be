import middy from '@middy/core';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { authGuard, type AuthenticatedEvent } from '../../shared/middleware/auth-guard';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const service = new AuthService(new UserRepository());
  const user    = await service.me(event.user.sub);
  return ok(user);
};

export const handler = middy(baseHandler)
  .use(authGuard())
  .use(errorHandler());
