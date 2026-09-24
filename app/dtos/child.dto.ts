export interface CreateChildDto {
  parentId: string;
  nameOrNickName: string;
  dateOfBirth: string;
  skillIds?: string[];
  interestCategoryIds?: string[];
  interestSubCategoryIds?: string[];
  interestTags?: string[];
}

/** POST /children/guest body — same shape as a normal child add. `variant`/`expireDate` are never
 * client-supplied: the service always sets variant: 'guest' and expireDate to today (UK calendar
 * date), the same fields a normal CreateChildDto leaves unset. */
export type CreateGuestChildDto = CreateChildDto;

export interface UpdateChildDto {
  nameOrNickName?: string;
  dateOfBirth?: string;
  skillIds?: string[];
}

export interface UpdateChildInterestsDto {
  interestCategoryIds: string[];
  interestSubCategoryIds: string[];
}

export interface UpdateChildInterestTagsDto {
  interestTags: string[];
}
