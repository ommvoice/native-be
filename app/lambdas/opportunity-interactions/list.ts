import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OpportunityInteractionService } from '../../services/opportunity-interaction.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { queryValidator } from '../../shared/middleware/body-validator.js';
import { ok } from '../../shared/utils/response.js';
import { getOpportunityInteractionsQuerySchema } from '../../schemas/opportunity-interaction.schema.js';
import type { GetOpportunityInteractionsQueryDto } from '../../dtos/opportunity-interaction.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const query = event.queryStringParameters as unknown as GetOpportunityInteractionsQueryDto;
  const data = await new OpportunityInteractionService().listEnriched(query);
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(queryValidator(getOpportunityInteractionsQuerySchema))
  .use(errorHandler());
