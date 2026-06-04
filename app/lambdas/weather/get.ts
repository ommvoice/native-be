import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getWeatherByPostcode } from '../../services/weather.service';
import { errorHandler } from '../../shared/middleware/error-handler';
import { AppError } from '../../shared/errors/app-error';
import { ok } from '../../shared/utils/response';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const postcode = event.queryStringParameters?.['postcode'];
  if (!postcode) throw new AppError(400, 'postcode query parameter is required');
  return ok(await getWeatherByPostcode(postcode));
};

export const handler = middy(baseHandler)
  .use(errorHandler());
