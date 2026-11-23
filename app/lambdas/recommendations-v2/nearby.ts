import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecommendationV2Service } from '../../services/recommendation-v2.service.js';
import { toOpportunityList } from '../../shared/utils/formatter/recommendation-formatter.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ok } from '../../shared/utils/response.js';
import { getInitialScore } from '../../services/scoring-v2.service.js';
import type { NearbySource } from '../../dtos/recommendation.dto.js';
import { resolveParentId } from '../../shared/auth/current-parent.js';
import { filterNearbyToActivityDay } from '../../shared/utils/formatter/plan-formatter.js';

const NEARBY_SOURCES: NearbySource[] = ['today-everyone', 'today-member', 'plan-member', 'plan-all'];

/** Steps each source skips. Today: every step runs (interest, tags, age, schedule, weather, distance)
 * — but weather only orders the row, it never hides a place (getNearby's weatherRankOnly).
 * Plan → Family Interests: no schedule/weather (same as /plan/family). Plan → Everything Local:
 * distance only. */
function nearbySkips(source?: NearbySource) {
  switch (source) {
    case 'plan-member':
      return getInitialScore({ skipSchedule: true, skipWeather: true });
    case 'plan-all':
      return getInitialScore({ skipInterests: true, skipIntrestTags: true, skipAges: true, skipSchedule: true, skipWeather: true });
    default:
      return getInitialScore({});
  }
}

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId = await resolveParentId(event, event.queryStringParameters?.['parentId']);
  const childId  = event.queryStringParameters?.['childId'];
  const opportunityLat  = event.queryStringParameters?.['opportunityLat'];
  const opportunityLong  = event.queryStringParameters?.['opportunityLong'];
  const sourceParam = event.queryStringParameters?.['source'];
  // The activity being viewed — nearby events/clubs must run on its day (see filterNearbyToActivityDay).
  const opportunityId   = event.queryStringParameters?.['opportunityId'];
  const opportunityType = event.queryStringParameters?.['opportunityType'];
  if (sourceParam && !NEARBY_SOURCES.includes(sourceParam as NearbySource)) {
    throw new AppError(400, `source must be one of: ${NEARBY_SOURCES.join(', ')}`);
  }
  const source = sourceParam as NearbySource | undefined;

  // Comma list of family member ids — a family is never this big; bounds the per-request work.
  if ((childId ?? '').split(',').length > 20) throw new AppError(400, 'childId has too many ids');

  const service = new RecommendationV2Service();
  // const { data: raw, childrenAges } = await service.getNearby({ parentId, childId, opportunityLat,  opportunityLong });
  const skipRecommendations = nearbySkips(source);
  const { data: raw, childrenAges } = await service.getNearby({ parentId, childId, opportunityLat, opportunityLong, source }, skipRecommendations);
  const list = toOpportunityList(raw as any, childrenAges);
  const data = await filterNearbyToActivityDay(list, { id: opportunityId, type: opportunityType });
  return ok({ count: data.length, data, mode: 'nearby' });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
