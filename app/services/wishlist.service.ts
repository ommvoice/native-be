import { AppError } from '../shared/errors/app-error';
import { WishlistRepository } from '../repositories/wishlist.repository';
import { enrichOpportunityRefs, opportunityRefKey } from '../shared/utils/opportunity-enrichment';
import { resolveOpportunityRef } from '../shared/utils/opportunity-ref';
import type { CreateWishlistDto, GetWishlistsQueryDto, AddWishlistItemDto } from '../dtos/wishlist.dto';

// Every child gets one wishlist auto-created in their name (see createDefaultForChild) —
// this is that wishlist's fixed color, since the create-child flow has no color picker.
const DEFAULT_CHILD_WISHLIST_COLOR = '#668CDE';

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

  /** Called from ChildService.create()/OnboardParentService.create() — every child gets a wishlist
   * named after them, attached via childId, by default. */
  async createDefaultForChild(parentId: string, childId: string, childName: string) {
    return this.repo.create({ name: childName, color: DEFAULT_CHILD_WISHLIST_COLOR, parentId, childId });
  }

  /** Cascade-deletes every wishlist belonging to one child (there's normally just the one
   * auto-created default, but a parent could also have created extra ones for the same child via
   * POST /wishlists, which also requires a childId) — called from ChildService.delete(). */
  async deleteAllForChild(parentId: string, childId: string) {
    const wishlists = await this.repo.listByParentId(parentId);
    const childWishlists = wishlists.filter((w) => w.childId === childId);
    await Promise.all(childWishlists.map((w) => this.delete(w.id)));
  }

  async delete(id: string) {
    const wishlist = await this.repo.getById(id);
    if (!wishlist) throw new AppError(404, 'Wishlist not found');
    const items = await this.repo.listItems(id);
    await Promise.all(items.map((item) => this.repo.removeItem(item.id)));
    await this.repo.delete(id);
  }

  /** Wishlist items enriched into full Opportunity cards — reuses the same asset-lookup +
   * card-formatting pipeline recommendations/plan endpoints use, so the Saved screen renders
   * identical card data without re-deriving it client-side. */
  async getEnrichedItems(wishlistId: string) {
    const wishlist = await this.repo.getById(wishlistId);
    if (!wishlist) throw new AppError(404, 'Wishlist not found');

    const items = await this.repo.listItems(wishlistId);
    const refs = items.map((item) => resolveOpportunityRef(item)).filter((r): r is NonNullable<typeof r> => !!r);
    const opportunities = await enrichOpportunityRefs(refs);

    return refs
      .map((ref) => opportunities.get(opportunityRefKey(ref.type, ref.id)))
      .filter((o): o is NonNullable<typeof o> => !!o);
  }

  async addItem(wishlistId: string, dto: AddWishlistItemDto) {
    const wishlist = await this.repo.getById(wishlistId);
    if (!wishlist) throw new AppError(404, 'Wishlist not found');
    return this.repo.addItem(wishlistId, dto.opportunityType, dto.opportunityId);
  }

  async removeItem(itemId: string) {
    await this.repo.removeItem(itemId);
  }
}
