import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { loginSchema } from '../../schemas/auth.schema';
import { ok } from '../../shared/utils/response';
import type { LoginDto } from '../../dtos/auth.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto     = event.body as unknown as LoginDto;
  const service = new AuthService(new UserRepository());
  const result  = await service.login(dto.email, dto.password);
  return ok(result);
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(loginSchema))
  .use(errorHandler());
