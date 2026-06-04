import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { opportunitySearchQuerySchema } from '../../schemas/search.schema';
import { AppError } from '../../shared/errors/app-error';
import { ok } from '../../shared/utils/response';
import { ParentRepository } from '../../repositories/parent.repository';
import { DrivingLegRepository } from '../../repositories/driving-leg.repository';
import { FacilityRepository } from '../../repositories/facility.repository';
import { RecommendationV2Repository } from '../../repositories/recommendation-v2.repository';
import { haversineDistanceMiles, metersToMilesOneDecimal } from '../../services/scoring.service';
import type { OpportunitySearchQueryDto } from '../../dtos/search.dto';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const qs = event.queryStringParameters ?? {};
  const dto: OpportunitySearchQueryDto = {
    parentId:                qs['parentId']!,
    childId:                 qs['childId'],
    interestSubCategorySlug: qs['interestSubCategorySlug'],
    facility:                qs['facility'] ? qs['facility'].split(',') : [],
    maxDistanceMiles:        qs['maxDistanceMiles']      ? Number(qs['maxDistanceMiles'])      : undefined,
    maxTimeToReachMinutes:   qs['maxTimeToReachMinutes'] ? Number(qs['maxTimeToReachMinutes']) : undefined,
  };

  const parentRepo   = new ParentRepository();
  const legRepo      = new DrivingLegRepository();
  const facilityRepo = new FacilityRepository();
  const recRepo      = new RecommendationV2Repository();

  const parent = await parentRepo.getById(dto.parentId);
  if (!parent) throw new AppError(404, 'Parent not found');

  const parentLat = Number.parseFloat(parent.latitude);
  const parentLon = Number.parseFloat(parent.longitude);
  if (!Number.isFinite(parentLat) || !Number.isFinite(parentLon)) {
    throw new AppError(400, 'Parent location is invalid');
  }

  // Validate facility slugs
  for (const slug of dto.facility ?? []) {
    const fac = await facilityRepo.getBySlug(slug);
    if (!fac) throw new AppError(400, `Unknown facility slug: ${slug}`);
  }

  const maxDurationSeconds = dto.maxTimeToReachMinutes != null ? dto.maxTimeToReachMinutes * 60 : undefined;
  const maxDistanceMeters  = dto.maxDistanceMiles      != null ? dto.maxDistanceMiles * 1609.344 : undefined;

  const allLegs = await legRepo.findByParentId(dto.parentId);
  const filteredLegs = allLegs.filter((leg) => {
    if (maxDurationSeconds != null && leg.drivingDurationSeconds > maxDurationSeconds) return false;
    if (maxDistanceMeters  != null && leg.drivingDistanceMeters  > maxDistanceMeters)  return false;
    return true;
  });

  if (filteredLegs.length === 0) return ok([]);

  const refs       = filteredLegs.map((l) => ({ type: l.opportunityType, id: l.opportunityId }));
  const payloadMap = await recRepo.getEnrichedPayloads(refs);

  const results = filteredLegs
    .sort((a, b) => a.drivingDurationSeconds - b.drivingDurationSeconds)
    .map((leg) => {
      const key     = `${leg.opportunityType}#${leg.opportunityId}`;
      const payload = payloadMap.get(key);
      if (!payload) return null;

      const oppLat = Number.parseFloat(leg.opportunityLatitude);
      const oppLon = Number.parseFloat(leg.opportunityLongitude);
      const distanceMiles = Number.isFinite(oppLat) && Number.isFinite(oppLon)
        ? Math.round(haversineDistanceMiles(parentLat, parentLon, oppLat, oppLon) * 10) / 10
        : null;

      return {
        ...payload,
        distanceMiles,
        drivingDistanceMiles:   metersToMilesOneDecimal(leg.drivingDistanceMeters),
        drivingDurationSeconds: leg.drivingDurationSeconds,
      };
    })
    .filter(Boolean);

  return ok(results);
};

export const handler = middy(baseHandler)
  .use(queryValidator(opportunitySearchQuerySchema))
  .use(errorHandler());
