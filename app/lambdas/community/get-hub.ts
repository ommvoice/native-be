import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CommunityService } from '../../services/community.service';
import { queryValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { getCommunityHubQuerySchema } from '../../schemas/community.schema';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId = event.queryStringParameters?.['parentId']!;
  return ok(await new CommunityService().getHub(parentId));
};

export const handler = middy(baseHandler)
  .use(queryValidator(getCommunityHubQuerySchema))
  .use(errorHandler());
