import { AppError } from '../shared/errors/app-error';
import { TABLES } from '../shared/db/tables';
import { batchDeleteItems, queryAllByIndex } from '../shared/db/dynamo-helpers';
import { UserRepository } from '../repositories/user.repository';
import { ParentRepository } from '../repositories/parent.repository';
import { AuthService } from './auth.service';

const ids = (items: Record<string, unknown>[], pkField = 'id') => items.map((i) => i[pkField] as string);

export class AccountService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly parentRepo: ParentRepository,
    private readonly authService: AuthService,
  ) {}

  /**
   * Permanently deletes the signed-in account and everything hanging off it:
   * wishlist items → wishlists → opportunity interactions → visit intentions → driving legs
   * → children → parent → user → Cognito login.
   *
   * Children-first / Cognito-last on purpose: if any step fails the user can still log in and
   * retry, instead of being left with orphaned data they can no longer reach. Every step is
   * idempotent (deletes of missing rows are no-ops), so a retry just finishes the job.
   */
  async deleteAccount(sub: string): Promise<void> {
    const user = await this.userRepo.getBySub(sub);
    if (!user) throw new AppError(404, 'User not found');

    const parent = await this.parentRepo.getByUserId(user.id);

    if (parent) {
      const parentId = parent.id;

      const [wishlists, interactions, visitIntentions, drivingLegs, children] = await Promise.all([
        queryAllByIndex(TABLES.wishlists, 'parentId-index', 'parentId', parentId),
        queryAllByIndex(TABLES.opportunityInteractions, 'parentId-index', 'parentId', parentId),
        queryAllByIndex(TABLES.visitIntentions, 'parentId-index', 'parentId', parentId),
        queryAllByIndex(TABLES.drivingLegs, 'parentId-index', 'parentId', parentId),
        queryAllByIndex(TABLES.children, 'parentId-index', 'parentId', parentId),
      ]);

      const wishlistItems = (
        await Promise.all(
          ids(wishlists).map((wishlistId) =>
            queryAllByIndex(TABLES.wishlistItems, 'wishlistId-index', 'wishlistId', wishlistId),
          ),
        )
      ).flat();

      await batchDeleteItems(TABLES.wishlistItems, ids(wishlistItems));
      await Promise.all([
        batchDeleteItems(TABLES.wishlists, ids(wishlists)),
        batchDeleteItems(TABLES.opportunityInteractions, ids(interactions)),
        batchDeleteItems(TABLES.visitIntentions, ids(visitIntentions)),
        batchDeleteItems(TABLES.drivingLegs, ids(drivingLegs, 'typeId'), 'typeId'),
      ]);
      await batchDeleteItems(TABLES.children, ids(children));
      await batchDeleteItems(TABLES.parents, [parentId]);
    }

    await batchDeleteItems(TABLES.users, [user.id]);
    await this.authService.deleteCognitoUser(user.email);
  }
}
