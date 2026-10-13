import { OpportunityInteractionRepository, opportunityInteractionKey, isSuppressed, suppressedUntil, suppressionEndFrom } from '../repositories/opportunity-interaction.repository';
import { enrichOpportunityRefs, opportunityRefKey } from '../shared/utils/opportunity-enrichment';
import type { CreateOpportunityInteractionDto, GetOpportunityInteractionsQueryDto } from '../dtos/opportunity-interaction.dto';

export class OpportunityInteractionService {
  private readonly repo: OpportunityInteractionRepository;

  constructor() {
    this.repo = new OpportunityInteractionRepository();
  }

  /** Visited/not-interested opportunities enriched into full Opportunity cards, paired with star
   * rating + visited-at — optionally narrowed to one interactionType (e.g. "visited" for the Saved
   * screen's Past Trips section). */
  async listEnriched(query: GetOpportunityInteractionsQueryDto) {
    // An expired "Not for us" (past its 90 days) no longer counts as an interaction at all.
    const active = (await this.repo.listByParentId(query.parentId))
      .filter((i) => i.interactionType !== 'not_interested' || isSuppressed(i));
    const interactions = query.interactionType ? active.filter((i) => i.interactionType === query.interactionType) : active;

    const opportunities = await enrichOpportunityRefs(
      interactions.map((i) => ({ type: i.opportunityType, id: i.opportunityId })),
    );

    return interactions
      .map((interaction) => {
        const opportunity = opportunities.get(opportunityRefKey(interaction.opportunityType, interaction.opportunityId));
        return opportunity
          ? { opportunity, interactionType: interaction.interactionType, starRating: interaction.starRating, visitedAt: interaction.visitedAt, suppressedUntil: suppressedUntil(interaction) }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => !!item);
  }

  async set(dto: CreateOpportunityInteractionDto) {
    // Preserve the original visitedAt on a rating-only re-set (e.g. editing a star rating after
    // the fact) — only stamp a fresh visitedAt the first time this ref is marked visited, matching
    // Lovable's updateRating(), which never touches visited_at.
    let visitedAt: string | null = null;
    if (dto.interactionType === 'visited') {
      const existingId = opportunityInteractionKey(dto.parentId, dto.opportunityType, dto.opportunityId);
      const existing = await this.repo.getById(existingId);
      visitedAt = existing?.visitedAt ?? new Date().toISOString();
    }

    return this.repo.upsert({
      parentId: dto.parentId,
      opportunityType: dto.opportunityType,
      opportunityId: dto.opportunityId,
      interactionType: dto.interactionType,
      starRating: dto.starRating ?? null,
      visitedAt,
      // "Not for us" — hidden from every recommendation/plan/search list for 90 days from now
      // (re-pressing it restarts the 90 days). See RecommendationV2Service.getItemsWithScore().
      suppressedUntil: dto.interactionType === 'not_interested' ? suppressionEndFrom(new Date().toISOString()) : null,
    });
  }

  async remove(id: string) {
    await this.repo.delete(id);
  }
}
