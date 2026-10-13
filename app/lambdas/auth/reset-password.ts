import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { resetPasswordSchema } from '../../schemas/auth.schema';
import { ok } from '../../shared/utils/response';
import type { ResetPasswordDto } from '../../dtos/auth.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto     = event.body as unknown as ResetPasswordDto;
  const service = new AuthService(new UserRepository());
  await service.resetPassword(dto.email, dto.code, dto.newPassword);
  return ok({ message: 'Your password has been updated. Please log in.' });
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(resetPasswordSchema))
  .use(errorHandler());
