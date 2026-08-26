import type { OpportunityRefType } from '../shared/utils/opportunity-ref';

export interface CreateWishlistDto {
  name: string;
  color: string;
  parentId: string;
  childId: string;
}

export interface GetWishlistsQueryDto {
  parentId: string;
}

export interface AddWishlistItemDto {
  opportunityId: string;
  opportunityType: OpportunityRefType;
}
