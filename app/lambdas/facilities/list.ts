import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { FacilityRepository } from '../../repositories/facility.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const list =  await new FacilityRepository().list();
  const uniqueFacilities = [
  ...new Map(list.map(item => [item.slug, item])).values(),
];

  return ok(uniqueFacilities);
};

export const handler = middy(baseHandler)
  .use(errorHandler());
