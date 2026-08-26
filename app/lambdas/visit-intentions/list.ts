import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { VisitIntentionService } from '../../services/visit-intention.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { queryValidator } from '../../shared/middleware/body-validator.js';
import { ok } from '../../shared/utils/response.js';
import { getVisitIntentionsQuerySchema } from '../../schemas/visit-intention.schema.js';
import type { GetVisitIntentionsQueryDto } from '../../dtos/visit-intention.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const query = event.queryStringParameters as unknown as GetVisitIntentionsQueryDto;
  const data = await new VisitIntentionService().listEnriched(query);
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(queryValidator(getVisitIntentionsQuerySchema))
  .use(errorHandler());
