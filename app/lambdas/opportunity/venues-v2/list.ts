import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OpportunityV2Repository } from '../../../repositories/opportunity-v2.repository';
import { errorHandler } from '../../../shared/middleware/error-handler';
import { ok } from '../../../shared/utils/response';

const baseHandler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return ok(await new OpportunityV2Repository().listVenues());
};

export const handler = middy(baseHandler).use(errorHandler());
