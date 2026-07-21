import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';
import {
  getAllEnums,
} from '../../shared/assets';


const baseHandler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const allEnums = getAllEnums();
  return ok(allEnums);
};

export const handler = middy(baseHandler)
  .use(errorHandler());
