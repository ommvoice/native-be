import { RecommendationV2Repository } from '../../repositories/recommendation-v2.repository';
import { toOpportunity, type EnrichedScoredRecommendationV2, type Opportunity } from './formatter/recommendation-formatter';
import { opportunityRefKey, type OpportunityRefType } from './opportunity-ref';

const repo = new RecommendationV2Repository();

/**
 * Resolves {type,id} refs — from wishlist items, visit intentions, or opportunity interactions —
 * into full formatted Opportunity cards, reusing the exact same asset-lookup + formatting pipeline
 * `/recommendations-v2`/`/plan/*` already use (`getEnrichedPayloads` + `toOpportunity`), instead of
 * re-deriving card fields. Keyed by the same "{type}#{id}" convention as legKey()/opportunityRefKey()
 * so callers can zip their own per-ref metadata (timeframe, star rating, ...) back onto each card.
 */
export async function enrichOpportunityRefs(refs: { type: OpportunityRefType; id: string }[]): Promise<Map<string, Opportunity>> {
  const payloadMap = await repo.getEnrichedPayloads(refs as { type: 'venue' | 'event' | 'club' | 'route'; id: string }[]);
  const result = new Map<string, Opportunity>();
  for (const [key, payload] of payloadMap) {
    result.set(key, toOpportunity(payload as unknown as EnrichedScoredRecommendationV2));
  }
  return result;
}

export { opportunityRefKey };
