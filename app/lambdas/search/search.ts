import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { opportunitySearchQuerySchema } from '../../schemas/search.schema';
import { AppError } from '../../shared/errors/app-error';
import { ok } from '../../shared/utils/response';
import { ParentRepository } from '../../repositories/parent.repository';
import { DrivingLegRepository } from '../../repositories/driving-leg.repository';
import { FacilityRepository, type FacilityRecord } from '../../repositories/facility.repository';
import { RecommendationV2Repository } from '../../repositories/recommendation-v2.repository';
import { haversineDistanceMiles, metersToMilesOneDecimal } from '../../services/scoring.service';
import type { OpportunitySearchQueryDto } from '../../dtos/search.dto';
import { matchesSearchFilters, type RawSearchPayload } from './search-filters';
import { toOpportunity, type EnrichedScoredRecommendationV2 } from '../../shared/utils/formatter/recommendation-formatter';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // queryValidator has already run the raw query string through
  // opportunitySearchQuerySchema, which yup-transforms comma-separated
  // strings into arrays — read the validated values directly rather than
  // re-parsing event.queryStringParameters by hand (the previous version did
  // `qs['facility'].split(',')` on a value that was already an array).
  const qs = (event.queryStringParameters ?? {}) as unknown as Record<string, unknown>;
  const dto: OpportunitySearchQueryDto = {
    parentId:                qs['parentId'] as string,
    childId:                 qs['childId'] as string | undefined,
    interestSubCategorySlug: qs['interestSubCategorySlug'] as string | undefined,
    facility:                (qs['facility'] as string[] | undefined) ?? [],
    maxDistanceMiles:        qs['maxDistanceMiles']      != null ? Number(qs['maxDistanceMiles'])      : undefined,
    maxTimeToReachMinutes:   qs['maxTimeToReachMinutes'] != null ? Number(qs['maxTimeToReachMinutes']) : undefined,
    themeSlug:               qs['themeSlug'] as string | undefined,
    themeVariantSlug:        (qs['themeVariantSlug'] as string[] | undefined) ?? [],
    routeDifficulty:         (qs['routeDifficulty'] as string[] | undefined) ?? [],
    routeType:               (qs['routeType'] as string[] | undefined) ?? [],
    routeMaxLengthMiles:     qs['routeMaxLengthMiles'] != null ? Number(qs['routeMaxLengthMiles']) : undefined,
    routeSuitability:        (qs['routeSuitability'] as string[] | undefined) ?? [],
    attractions:             (qs['attractions'] as string[] | undefined) ?? [],
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

  // Validate facility slugs and build a slug->record map for label-based
  // fuzzy matching against the free-text facility fields (see search-filters.ts).
  const facilitiesBySlug = new Map<string, FacilityRecord>();
  for (const slug of dto.facility ?? []) {
    const fac = await facilityRepo.getBySlug(slug);
    if (!fac) throw new AppError(400, `Unknown facility slug: ${slug}`);
    facilitiesBySlug.set(slug, fac);
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

  // interestSubCategorySlug is a legacy singular alias for the same concept
  // as themeVariantSlug — merge both into one array so either caller shape works.
  const themeVariantSlugs = [
    ...(dto.themeVariantSlug ?? []),
    ...(dto.interestSubCategorySlug ? [dto.interestSubCategorySlug] : []),
  ];

  const results = filteredLegs
    .sort((a, b) => a.drivingDurationSeconds - b.drivingDurationSeconds)
    .map((leg) => {
      const key     = `${leg.opportunityType}#${leg.opportunityId}`;
      const payload = payloadMap.get(key);
      if (!payload) return null;

      const rawRecord = { ...payload, opportunityType: leg.opportunityType } as RawSearchPayload;

      const matches = matchesSearchFilters(
        rawRecord,
        {
          themeSlug: dto.themeSlug,
          themeVariantSlugs,
          facilitySlugs: dto.facility,
          routeDifficulty: dto.routeDifficulty,
          routeType: dto.routeType,
          routeMaxLengthMiles: dto.routeMaxLengthMiles,
          routeSuitability: dto.routeSuitability,
          attractions: dto.attractions,
        },
        facilitiesBySlug,
      );
      if (!matches) return null;

      const oppLat = Number.parseFloat(leg.opportunityLatitude);
      const oppLon = Number.parseFloat(leg.opportunityLongitude);
      const distanceMiles = Number.isFinite(oppLat) && Number.isFinite(oppLon)
        ? Math.round(haversineDistanceMiles(parentLat, parentLon, oppLat, oppLon) * 10) / 10
        : null;

      const themeRef = (rawRecord as unknown as { theme?: { slug?: string } }).theme;
      const themeVariantRef = (rawRecord as unknown as { themeVariant?: { slug?: string } }).themeVariant;

      const enriched: EnrichedScoredRecommendationV2 = {
        ...rawRecord,
        id: leg.opportunityId,
        opportunityType: leg.opportunityType,
        image: (rawRecord as unknown as { image?: string | null }).image ?? null,
        latitude: leg.opportunityLatitude,
        longitude: leg.opportunityLongitude,
        distanceMiles,
        drivingDistanceMiles: metersToMilesOneDecimal(leg.drivingDistanceMeters),
        drivingDurationSeconds: leg.drivingDurationSeconds,
        themeSlug: themeRef?.slug,
        themeVariantSlug: themeVariantRef?.slug,
      };

      return toOpportunity(enriched);
    })
    .filter(Boolean);

  return ok(results);
};

export const handler = middy(baseHandler)
  .use(queryValidator(opportunitySearchQuerySchema))
  .use(errorHandler());
