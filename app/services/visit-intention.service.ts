import { VisitIntentionRepository } from '../repositories/visit-intention.repository';
import { enrichOpportunityRefs, opportunityRefKey } from '../shared/utils/opportunity-enrichment';
import type { CreateVisitIntentionDto, GetVisitIntentionsQueryDto } from '../dtos/visit-intention.dto';

export class VisitIntentionService {
  private readonly repo: VisitIntentionRepository;

  constructor() {
    this.repo = new VisitIntentionRepository();
  }

  /** Reminders enriched into full Opportunity cards, paired with the timeframe each was set for —
   * "Remind Me" (tomorrow/this_weekend/next_month) or an effort-based reminder ("effort_<slug>"). */
  async listEnriched(query: GetVisitIntentionsQueryDto) {
    const intentions = await this.repo.listByParentId(query.parentId);
    const opportunities = await enrichOpportunityRefs(
      intentions.map((i) => ({ type: i.opportunityType, id: i.opportunityId })),
    );

    return intentions
      .map((intention) => {
        const opportunity = opportunities.get(opportunityRefKey(intention.opportunityType, intention.opportunityId));
        return opportunity ? { opportunity, timeframe: intention.timeframe } : null;
      })
      .filter((item): item is NonNullable<typeof item> => !!item);
  }

  async set(dto: CreateVisitIntentionDto) {
    return this.repo.upsert(dto);
  }

  async remove(id: string) {
    await this.repo.delete(id);
  }
}
