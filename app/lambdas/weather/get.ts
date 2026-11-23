import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getWeatherByPostcode } from '../../services/weather.service';
import { errorHandler } from '../../shared/middleware/error-handler';
import { AppError } from '../../shared/errors/app-error';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const postcode = event.queryStringParameters?.['postcode'];
  if (!postcode) throw new AppError(400, 'postcode query parameter is required');
  // UK postcode (full or outward code only) — nothing else is forwarded to the weather provider.
  if (!/^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i.test(postcode.trim())) {
    throw new AppError(400, 'postcode must be a valid UK postcode');
  }
  return ok(await getWeatherByPostcode(postcode.trim()));
};

export const handler = middy(baseHandler)
  .use(errorHandler());
