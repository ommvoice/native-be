import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../../repositories/user.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { getAuthUser } from '../../shared/middleware/auth-guard';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sub }    = getAuthUser(event);
  const userRepo   = new UserRepository();
  const parentRepo = new ParentRepository();

  const user = await userRepo.getBySub(sub);
  if (!user) throw new AppError(401, 'User not found');

  const parent = user.role === 'PARENT' ? await parentRepo.getByUserId(user.id) : null;
  return ok({ ...user, parent: parent ?? null });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
