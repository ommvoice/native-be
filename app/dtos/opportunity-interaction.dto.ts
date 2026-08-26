import type { OpportunityRefType } from '../shared/utils/opportunity-ref';
import type { InteractionType } from '../repositories/opportunity-interaction.repository';

export interface CreateOpportunityInteractionDto {
  parentId: string;
  opportunityId: string;
  opportunityType: OpportunityRefType;
  interactionType: InteractionType;
  starRating?: number;
}

export interface GetOpportunityInteractionsQueryDto {
  parentId: string;
  interactionType?: InteractionType;
}
