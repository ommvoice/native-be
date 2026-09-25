import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { getAuthUser } from '../../shared/middleware/auth-guard';
import { errorHandler } from '../../shared/middleware/error-handler';
import { AppError } from '../../shared/errors/app-error';
import { noContent } from '../../shared/utils/response';

/** DELETE /users/me — permanently deletes the caller's account and all related data. */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sub } = getAuthUser(event);
  if (!sub) throw new AppError(401, 'Unauthorized');

  const userRepo = new UserRepository();
  const service  = new AccountService(userRepo, new ParentRepository(), new AuthService(userRepo));
  await service.deleteAccount(sub);
  return noContent();
};

export const handler = middy(baseHandler)
  .use(errorHandler());
