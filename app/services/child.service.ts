import { assertOwned } from '../shared/auth/current-parent';
import { ChildRepository, type ChildRecord } from '../repositories/child.repository';
import { InterestRepository } from '../repositories/interest.repository';
import { ParentRepository } from '../repositories/parent.repository';
import { WishlistService } from './wishlist.service';
import { AppClock } from '../shared/utils/app-clock';
import type { CreateChildDto, CreateGuestChildDto, UpdateChildDto } from '../dtos/child.dto';

export class ChildService {
  constructor(
    private readonly childRepo: ChildRepository,
    private readonly interestRepo: InterestRepository,
    private readonly parentRepo: ParentRepository,
    private readonly wishlistService: WishlistService,
  ) {}

  private async enrich(child: ChildRecord) {
    const [interestCategories, interestSubCategories, parent] = await Promise.all([
      this.interestRepo.getCategoriesBySlugs(child.interestCategoryIds),
      this.interestRepo.getSubCategoriesBySlugs(child.interestSubCategoryIds),
      this.parentRepo.getById(child.parentId),
    ]);
    return { ...child, parent, interestCategories, interestSubCategories };
  }

  async create(dto: CreateChildDto) {
    const child = await this.childRepo.create({
      parentId:               dto.parentId,
      nameOrNickName:         dto.nameOrNickName,
      dateOfBirth:            dto.dateOfBirth,
      variant:                dto.variant ?? 'child',
      skillIds:               dto.skillIds ?? [],
      interestCategoryIds:    dto.interestCategoryIds ?? [],
      interestSubCategoryIds: dto.interestSubCategoryIds ?? [],
      interestTags:           dto.interestTags ?? [],
    });
    // Every child gets a wishlist named after them by default.
    await this.wishlistService.createDefaultForChild(child.parentId, child.id, child.nameOrNickName);
    return child;
  }

  /**
   * "Include someone extra today" (HaveWeGotEveryoneSheet / the Today & Explore inline guest
   * forms) — a real child row, so it flows through recommendations/PersonFilter/pricing exactly
   * like any other child, but tagged variant: 'guest' and stamped with today's UK calendar date as
   * expireDate. Never client-supplied: deleteExpiredGuests() below (run from GET /users/me) removes
   * it once expireDate is in the past.
   */
  async createGuest(dto: CreateGuestChildDto) {
    const child = await this.childRepo.create({
      parentId:               dto.parentId,
      nameOrNickName:         dto.nameOrNickName,
      dateOfBirth:            dto.dateOfBirth,
      skillIds:               dto.skillIds ?? [],
      interestCategoryIds:    dto.interestCategoryIds ?? [],
      interestSubCategoryIds: dto.interestSubCategoryIds ?? [],
      interestTags:           dto.interestTags ?? [],
      variant:                'guest',
      expireDate:             AppClock.isoDateString(),
    });
    await this.wishlistService.createDefaultForChild(child.parentId, child.id, child.nameOrNickName);
    return child;
  }

  /**
   * Called from GET /users/me on every session restore (not a real-time TTL — see the guest-child
   * plan) — deletes any of this parent's guest children whose expireDate has passed, cascading the
   * same way a manual delete() does (wishlist + items) so nothing is orphaned. A guest added today
   * stays valid through the rest of today; it's only swept starting the next UK calendar day.
   * Best-effort: one failed delete doesn't stop the others or fail the caller's /me request.
   */
  async deleteExpiredGuests(parentId: string): Promise<string[]> {
    const children = await this.childRepo.listByParentId(parentId);
    const today = AppClock.isoDateString();
    const expired = children.filter((c) => c.variant === 'guest' && !!c.expireDate && c.expireDate < today);
    if (expired.length === 0) return [];

    const results = await Promise.allSettled(expired.map((c) => this.delete(c.id, parentId)));
    return expired.filter((_, i) => results[i].status === 'fulfilled').map((c) => c.id);
  }

  /** Loads a child and checks it belongs to `ownerParentId` (404 otherwise, so ids can't be probed). */
  private async getOwned(id: string, ownerParentId: string): Promise<ChildRecord> {
    return assertOwned(await this.childRepo.getById(id), ownerParentId, 'Child not found');
  }

  async getById(id: string, ownerParentId: string) {
    return this.enrich(await this.getOwned(id, ownerParentId));
  }

  async update(id: string, dto: UpdateChildDto, ownerParentId: string) {
    await this.getOwned(id, ownerParentId);
    await this.childRepo.update(id, dto);
    return this.getById(id, ownerParentId);
  }

  async updateInterests(id: string, categoryIds: string[], subCategoryIds: string[], ownerParentId: string) {
    await this.getOwned(id, ownerParentId);
    await this.childRepo.updateInterests(id, categoryIds, subCategoryIds);
    return this.getById(id, ownerParentId);
  }

  async updateInterestTags(id: string, tags: string[], ownerParentId: string) {
    await this.getOwned(id, ownerParentId);
    await this.childRepo.updateInterestTags(id, tags);
    return this.getById(id, ownerParentId);
  }

  async delete(id: string, ownerParentId: string) {
    const child = await this.getOwned(id, ownerParentId);
    // Cascade: the child's default (and any other) wishlist, plus each wishlist's items.
    await this.wishlistService.deleteAllForChild(child.parentId, id);
    await this.childRepo.delete(id);
  }
}
