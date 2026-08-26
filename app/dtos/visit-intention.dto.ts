import type { OpportunityRefType } from '../shared/utils/opportunity-ref';

export interface CreateVisitIntentionDto {
  parentId: string;
  opportunityId: string;
  opportunityType: OpportunityRefType;
  /** 'tomorrow' | 'this_weekend' | 'next_month' | 'effort_<slug>' — free text, matching
   * nativeapp-main-loveable's visit_intentions.intended_timeframe convention. */
  timeframe: string;
}

export interface GetVisitIntentionsQueryDto {
  parentId: string;
}
