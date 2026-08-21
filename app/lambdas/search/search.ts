import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryValidator } from '../../shared/middleware/body-validator';
import { errorHandler } from '../../shared/middleware/error-handler';
import { opportunitySearchQuerySchema } from '../../schemas/search.schema';
import { AppError } from '../../shared/errors/app-error';
import { ok } from '../../shared/utils/response';
import { RecommendationV2Repository } from '../../repositories/recommendation-v2.repository';
import type { OpportunitySearchQueryDto } from '../../dtos/search.dto';
import { toOpportunityList, } from '../../shared/utils/formatter/recommendation-formatter';
import { Narrowed } from '../../shared/types/assets.types';
import { RecommendationV2Service } from '../../services/recommendation-v2.service';
import { getInitialScore } from '../../services/scoring-v2.service';
import type { Score } from '../../dtos/recommendation.dto';

const SKIP_ALL = 'all';

/** Maps the query's skipRecommendations list onto the Score getItemsWithScore
 * expects — "all" skips every dimension, a list of dimension names skips
 * only those, and no list (undefined/empty, i.e. absent from the query)
 * means don't skip anything: score every dimension normally. */
const buildSkipRecommendationsScore = (skipRecommendations?: string[]): Score | undefined => {
  if (!skipRecommendations || skipRecommendations.length === 0) return undefined;

  if (skipRecommendations.includes(SKIP_ALL)) {
    return getInitialScore({ skipAll: true });
  }

  const skip = new Set(skipRecommendations);
  return getInitialScore({
    skipInterests: skip.has('interests'),
    skipIntrestTags: skip.has('interestTags'),
    skipAges: skip.has('ages'),
    skipWeather: skip.has('weather'),
    skipSchedule: skip.has('schedule'),
    skipDistance: skip.has('distance'),
  });
};

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // queryValidator has already run the raw query string through
  // opportunitySearchQuerySchema, which yup-transforms comma-separated
  // strings into arrays — read the validated values directly rather than
  // re-parsing event.queryStringParameters by hand (the previous version did
  // `qs['facility'].split(',')` on a value that was already an array).
  const qs = (event.queryStringParameters ?? {}) as unknown as Record<string, unknown>;
  const dto: OpportunitySearchQueryDto = {
    parentId: qs['parentId'] as string,
    childId: qs['childId'] as string | undefined,
    interestSubCategorySlug: qs['interestSubCategorySlug'] as string | undefined,
    facility: (qs['facility'] as string[] | undefined) ?? [],
    maxDistanceMiles: qs['maxDistanceMiles'] != null ? Number(qs['maxDistanceMiles']) : undefined,
    maxTimeToReachMinutes: qs['maxTimeToReachMinutes'] != null ? Number(qs['maxTimeToReachMinutes']) : undefined,
    themeSlug: qs['themeSlug'] as string | undefined,
    themeVariantSlug: (qs['themeVariantSlug'] as string[] | undefined) ?? [],
    routeDifficulty: (qs['routeDifficulty'] as string[] | undefined) ?? [],
    routeType: (qs['routeType'] as string[] | undefined) ?? [],
    routeMaxLengthMiles: qs['routeMaxLengthMiles'] != null ? Number(qs['routeMaxLengthMiles']) : undefined,
    routeSuitability: (qs['routeSuitability'] as string[] | undefined) ?? [],
    attractions: (qs['attractions'] as string[] | undefined) ?? [],
    searchRadius: qs['searchRadius'] as string | undefined,
    skipRecommendations: (qs['skipRecommendations'] as string[] | undefined) ?? [],
  };


  //------TODO: Move to service------------
  const recRepo = new RecommendationV2Repository();
  const recService = new RecommendationV2Service();

  const parent = await recRepo.getParentForRecommendations(dto.parentId);
  if (!parent) throw new AppError(404, 'Parent not found');

  const narrowed = dto.childId
    ? { ...parent, children: parent.children.filter((c) => c.id === dto.childId) }
    : parent;

  if (!narrowed.children.length) {
    throw new AppError(400, 'No children found for this query. Add a child or remove childId filter.');
  }

  let narrowedParams: Narrowed = {
    ...narrowed,
    ...(dto.maxDistanceMiles && { searchRadius: Number(dto.maxDistanceMiles) })
  }

  const skipRecommendations = buildSkipRecommendationsScore(dto.skipRecommendations);
  
  const { data: raw, childrenAges } = await recService.getItemsWithScore(narrowedParams, skipRecommendations)
  const data = toOpportunityList(raw as any, childrenAges);
  
  
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(queryValidator(opportunitySearchQuerySchema))
  .use(errorHandler());
