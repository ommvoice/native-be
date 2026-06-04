export interface CreateWishlistDto {
  name: string;
  color: string;
  parentId: string;
  childId: string;
}

export interface GetWishlistsQueryDto {
  parentId: string;
}
