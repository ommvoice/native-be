import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { registerSchema } from '../../schemas/auth.schema';
import { created } from '../../shared/utils/response';
import type { RegisterDto } from '../../dtos/auth.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto  = event.body as unknown as RegisterDto;
  const service = new AuthService(new UserRepository());
  const result  = await service.register(dto.email, dto.password);
  return created(result);
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(registerSchema))
  .use(errorHandler());
