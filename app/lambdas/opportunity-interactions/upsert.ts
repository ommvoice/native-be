import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OpportunityInteractionService } from '../../services/opportunity-interaction.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { bodyValidator } from '../../shared/middleware/body-validator.js';
import { ok } from '../../shared/utils/response.js';
import { setOpportunityInteractionSchema } from '../../schemas/opportunity-interaction.schema.js';
import type { CreateOpportunityInteractionDto } from '../../dtos/opportunity-interaction.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto = event.body as unknown as CreateOpportunityInteractionDto;
  const record = await new OpportunityInteractionService().set(dto);
  return ok(record);
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(setOpportunityInteractionSchema))
  .use(errorHandler());
