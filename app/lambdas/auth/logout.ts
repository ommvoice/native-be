import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../../services/auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { refreshSchema } from '../../schemas/auth.schema';
import { noContent } from '../../shared/utils/response';
import type { RefreshDto } from '../../dtos/auth.dto';

/** POST /auth/logout { refreshToken } — revokes the refresh token server-side. Always 204. */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto = event.body as unknown as RefreshDto;
  await new AuthService(new UserRepository()).logout(dto.refreshToken);
  return noContent();
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(refreshSchema))
  .use(errorHandler());
