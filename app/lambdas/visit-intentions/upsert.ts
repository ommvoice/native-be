import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { VisitIntentionService } from '../../services/visit-intention.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { bodyValidator } from '../../shared/middleware/body-validator.js';
import { ok } from '../../shared/utils/response.js';
import { setVisitIntentionSchema } from '../../schemas/visit-intention.schema.js';
import type { CreateVisitIntentionDto } from '../../dtos/visit-intention.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto = event.body as unknown as CreateVisitIntentionDto;
  const record = await new VisitIntentionService().set(dto);
  return ok(record);
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(setVisitIntentionSchema))
  .use(errorHandler());
