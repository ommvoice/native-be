import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { FacilityRepository } from '../../repositories/facility.repository';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';

const baseHandler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const list =  await new FacilityRepository().list();
  const allUniqueFacilities = [
  ...new Map(list.map(item => [item.slug, item])).values(),
];

 const filteredFacilities = allUniqueFacilities.filter((facility) => facility.type !== 'DOG');

  return ok(filteredFacilities);
};

export const handler = middy(baseHandler)
  .use(errorHandler());
