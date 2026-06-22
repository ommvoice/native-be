import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { bodyValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { mapboxDirectionsSchema } from '../../schemas/mapbox.schema';
import { getDirections } from '../../services/mapbox-directions.service';
import { ok } from '../../shared/utils/response';
import type { MapboxDirectionsDto } from '../../dtos/mapbox.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const dto = event.body as unknown as MapboxDirectionsDto;
  return ok(await getDirections(dto.originLat, dto.originLng, dto.destLat, dto.destLng));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(mapboxDirectionsSchema))
  .use(errorHandler());
