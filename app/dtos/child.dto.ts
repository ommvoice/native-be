export interface CreateChildDto {
  parentId: string;
  nameOrNickName: string;
  dateOfBirth: string;
  skillIds?: string[];
  interestCategoryIds?: string[];
  interestSubCategoryIds?: string[];
  interestTags?: string[];
}

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
