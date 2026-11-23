import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RecommendationV2Service } from '../../services/recommendation-v2.service.js';
import { toOpportunityList } from '../../shared/utils/formatter/recommendation-formatter.js';
import { groupOpportunitiesByInterest } from '../../shared/utils/formatter/plan-formatter.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { ok } from '../../shared/utils/response.js';
import { getInitialScore } from '../../services/scoring-v2.service.js';
import { resolveParentId } from '../../shared/auth/current-parent.js';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const parentId     = await resolveParentId(event, event.queryStringParameters?.['parentId']);
  const childId      = event.queryStringParameters?.['childId'];
  const searchRadius = event.queryStringParameters?.['searchRadius'];

  const service = new RecommendationV2Service();
  // Everything Local tab — every scoring dimension is skipped, so this is the
  // full local opportunity pool, unranked/unfiltered by interests, age,
  // weather, schedule or distance, just grouped by interest for display.
  const skipRecommendations = getInitialScore({ 
    skipAll: true,
  });
  // Nothing is filtered out, but interest + tags still rank it: no childId → the parent's interests
  // (parent only); childId → that member's. Prices always count every family member.
  const { data: raw, childrenAges } = await service.getRecommendations2(
    { parentId, childId, searchRadius },
    skipRecommendations,
    { parentOnly: !childId, priceAllMembers: true },
  );
  const opportunities = toOpportunityList(raw as any, childrenAges);
  const data = await groupOpportunitiesByInterest(opportunities);
  return ok({ count: data.length, data });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
