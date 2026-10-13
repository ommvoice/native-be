import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { forgotPasswordSchema } from '../../schemas/auth.schema';
import { ok } from '../../shared/utils/response';
import type { ForgotPasswordDto } from '../../dtos/auth.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto     = event.body as unknown as ForgotPasswordDto;
  const service = new AuthService(new UserRepository());
  await service.forgotPassword(dto.email);
  // Same response whether or not the account exists — see AuthService.forgotPassword().
  return ok({ message: 'If an account exists for this email, a reset code has been sent.' });
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(forgotPasswordSchema))
  .use(errorHandler());
