import { AppError } from '../shared/errors/app-error';
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

    const results = await Promise.allSettled(expired.map((c) => this.delete(c.id)));
    return expired.filter((_, i) => results[i].status === 'fulfilled').map((c) => c.id);
  }

  async getById(id: string) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    return this.enrich(child);
  }

  async update(id: string, dto: UpdateChildDto) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    await this.childRepo.update(id, dto);
    return this.getById(id);
  }

  async updateInterests(id: string, categoryIds: string[], subCategoryIds: string[]) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    await this.childRepo.updateInterests(id, categoryIds, subCategoryIds);
    return this.getById(id);
  }

  async updateInterestTags(id: string, tags: string[]) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    await this.childRepo.updateInterestTags(id, tags);
    return this.getById(id);
  }

  async delete(id: string) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    // Cascade: the child's default (and any other) wishlist, plus each wishlist's items.
    await this.wishlistService.deleteAllForChild(child.parentId, id);
    await this.childRepo.delete(id);
  }
}
