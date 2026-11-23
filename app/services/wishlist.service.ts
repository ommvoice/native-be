import { AppError } from '../shared/errors/app-error';
import { WishlistRepository, type WishlistRecord } from '../repositories/wishlist.repository';
import { ChildRepository } from '../repositories/child.repository';
import { assertOwned } from '../shared/auth/current-parent';
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

  /** `dto.parentId` must already be the caller's own (set by the handler from the token); the
   * child the wishlist is attached to must belong to that same family. */
  async create(dto: CreateWishlistDto) {
    assertOwned(await new ChildRepository().getById(dto.childId), dto.parentId, 'Child not found');
    return this.repo.create({ name: dto.name, color: dto.color, parentId: dto.parentId, childId: dto.childId });
  }

  /** Loads a wishlist and checks it belongs to `ownerParentId` (404 otherwise). */
  private async getOwned(id: string, ownerParentId: string): Promise<WishlistRecord> {
    return assertOwned(await this.repo.getById(id), ownerParentId, 'Wishlist not found');
  }

  /** Called from ChildService.create()/OnboardParentService.create() — every child gets a wishlist
   * named after them, attached via childId, by default. */
  async createDefaultForChild(parentId: string, childId: string, childName: string) {
    return this.repo.create({ name: `${childName}'s Favourites`, color: DEFAULT_CHILD_WISHLIST_COLOR, parentId, childId });
  }

  /** Cascade-deletes every wishlist belonging to one child (there's normally just the one
   * auto-created default, but a parent could also have created extra ones for the same child via
   * POST /wishlists, which also requires a childId) — called from ChildService.delete(). */
  async deleteAllForChild(parentId: string, childId: string) {
    const wishlists = await this.repo.listByParentId(parentId);
    const childWishlists = wishlists.filter((w) => w.childId === childId);
    await Promise.all(childWishlists.map((w) => this.delete(w.id, parentId)));
  }

  async delete(id: string, ownerParentId: string) {
    await this.getOwned(id, ownerParentId);
    const items = await this.repo.listItems(id);
    await Promise.all(items.map((item) => this.repo.removeItem(item.id)));
    await this.repo.delete(id);
  }

  /** Wishlist items enriched into full Opportunity cards — reuses the same asset-lookup +
   * card-formatting pipeline recommendations/plan endpoints use, so the Saved screen renders
   * identical card data without re-deriving it client-side. */
  async getEnrichedItems(wishlistId: string, ownerParentId: string) {
    await this.getOwned(wishlistId, ownerParentId);

    const items = await this.repo.listItems(wishlistId);
    const refs = items.map((item) => resolveOpportunityRef(item)).filter((r): r is NonNullable<typeof r> => !!r);
    const opportunities = await enrichOpportunityRefs(refs);

    return refs
      .map((ref) => opportunities.get(opportunityRefKey(ref.type, ref.id)))
      .filter((o): o is NonNullable<typeof o> => !!o);
  }

  async addItem(wishlistId: string, dto: AddWishlistItemDto, ownerParentId: string) {
    await this.getOwned(wishlistId, ownerParentId);
    return this.repo.addItem(wishlistId, dto.opportunityType, dto.opportunityId);
  }

  /** Item ids are `${wishlistId}#${type}#${opportunityId}` (wishlistItemKey) — the owning wishlist
   * is checked before deleting. */
  async removeItem(itemId: string, ownerParentId: string) {
    const wishlistId = itemId.split('#')[0];
    if (!wishlistId) throw new AppError(404, 'Wishlist item not found');
    await this.getOwned(wishlistId, ownerParentId);
    await this.repo.removeItem(itemId);
  }
}
