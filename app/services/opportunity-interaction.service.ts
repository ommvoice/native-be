import { OpportunityInteractionRepository, opportunityInteractionKey } from '../repositories/opportunity-interaction.repository';
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
    const all = await this.repo.listByParentId(query.parentId);
    const interactions = query.interactionType ? all.filter((i) => i.interactionType === query.interactionType) : all;

    const opportunities = await enrichOpportunityRefs(
      interactions.map((i) => ({ type: i.opportunityType, id: i.opportunityId })),
    );

    return interactions
      .map((interaction) => {
        const opportunity = opportunities.get(opportunityRefKey(interaction.opportunityType, interaction.opportunityId));
        return opportunity
          ? { opportunity, interactionType: interaction.interactionType, starRating: interaction.starRating, visitedAt: interaction.visitedAt }
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
    });
  }

  async remove(id: string) {
    await this.repo.delete(id);
  }
}
