import { AppError } from '../shared/errors/app-error';
import { WishlistRepository } from '../repositories/wishlist.repository';
import type { CreateWishlistDto, GetWishlistsQueryDto } from '../dtos/wishlist.dto';

export class WishlistService {
  private readonly repo: WishlistRepository;

  constructor() {
    this.repo = new WishlistRepository();
  }

  async list(query: GetWishlistsQueryDto) {
    return this.repo.listByParentId(query.parentId);
  }

  async create(dto: CreateWishlistDto) {
    return this.repo.create(dto);
  }

  async getItems(wishlistId: string) {
    const wishlist = await this.repo.getById(wishlistId);
    if (!wishlist) throw new AppError(404, 'Wishlist not found');
    return this.repo.listItems(wishlistId);
  }
}
