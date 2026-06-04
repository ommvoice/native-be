import middy from '@middy/core';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../../repositories/user.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { authGuard, type AuthenticatedEvent } from '../../shared/middleware/auth-guard';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';

const baseHandler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  const userRepo   = new UserRepository();
  const parentRepo = new ParentRepository();

  const user = await userRepo.getBySub(event.user.sub);
  if (!user) throw new AppError(401, 'User not found');

  const parent = user.role === 'PARENT' ? await parentRepo.getByUserId(user.id) : null;
  return ok({ ...user, parent: parent ?? null });
};

export const handler = middy(baseHandler)
  .use(authGuard())
  .use(errorHandler());
