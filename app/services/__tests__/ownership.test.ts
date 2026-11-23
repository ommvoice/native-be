import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Repos mocked at module level (services construct their own repos) ────────────────────────────
const users = vi.hoisted(() => ({ getBySub: vi.fn() }));
const parents = vi.hoisted(() => ({ getByUserId: vi.fn(), getById: vi.fn() }));
const children = vi.hoisted(() => ({
  getById: vi.fn(), update: vi.fn(), updateInterests: vi.fn(), updateInterestTags: vi.fn(), delete: vi.fn(),
  listByParentId: vi.fn(async () => []),
}));
const wishlists = vi.hoisted(() => ({
  getById: vi.fn(), create: vi.fn(async (d: object) => ({ id: 'w-new', ...d })), delete: vi.fn(),
  listItems: vi.fn(async () => []), addItem: vi.fn(), removeItem: vi.fn(), listByParentId: vi.fn(async () => []),
}));
const intentions = vi.hoisted(() => ({ delete: vi.fn() }));
const interactions = vi.hoisted(() => ({ delete: vi.fn() }));

vi.mock('../../repositories/user.repository', () => ({ UserRepository: vi.fn(function () { return users; }) }));
vi.mock('../../repositories/parent.repository', () => ({ ParentRepository: vi.fn(function () { return parents; }) }));
vi.mock('../../repositories/child.repository', () => ({ ChildRepository: vi.fn(function () { return children; }) }));
vi.mock('../../repositories/wishlist.repository', () => ({ WishlistRepository: vi.fn(function () { return wishlists; }) }));
vi.mock('../../repositories/visit-intention.repository', () => ({ VisitIntentionRepository: vi.fn(function () { return intentions; }) }));
vi.mock('../../repositories/opportunity-interaction.repository', () => ({
  OpportunityInteractionRepository: vi.fn(function () { return interactions; }),
  opportunityInteractionKey: vi.fn(), isSuppressed: vi.fn(), suppressedUntil: vi.fn(), suppressionEndFrom: vi.fn(),
}));

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { resolveParentId } from '../../shared/auth/current-parent';
import { ChildService } from '../child.service';
import { WishlistService } from '../wishlist.service';
import { VisitIntentionService } from '../visit-intention.service';
import { OpportunityInteractionService } from '../opportunity-interaction.service';

const ME = 'parent-A';
const OTHER = 'parent-B';
const eventFor = (sub: string) => ({ requestContext: { authorizer: { sub, email: 'x@y.z' } } }) as unknown as APIGatewayProxyEvent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const childService = () => new ChildService(children as any, { getCategoriesBySlugs: vi.fn(async () => []), getSubCategoriesBySlugs: vi.fn(async () => []) } as any, parents as any, new WishlistService());

describe('resolveParentId (IDOR guard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    users.getBySub.mockResolvedValue({ id: 'user-A' });
    parents.getByUserId.mockResolvedValue({ id: ME, userId: 'user-A' });
  });

  it("returns the caller's own parent id from the token", async () => {
    await expect(resolveParentId(eventFor('sub-A'))).resolves.toBe(ME);
  });
  it('accepts a matching client parentId (old app builds)', async () => {
    await expect(resolveParentId(eventFor('sub-A'), ME)).resolves.toBe(ME);
  });
  it("403s on another family's parentId", async () => {
    await expect(resolveParentId(eventFor('sub-A'), OTHER)).rejects.toMatchObject({ statusCode: 403 });
  });
  it('401s without an authenticated sub', async () => {
    await expect(resolveParentId(eventFor(''))).rejects.toMatchObject({ statusCode: 401 });
  });
  it('401s when the sub has no user', async () => {
    users.getBySub.mockResolvedValue(null);
    await expect(resolveParentId(eventFor('sub-X'))).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('ChildService ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    children.getById.mockResolvedValue({ id: 'child-B', parentId: OTHER, interestCategoryIds: [], interestSubCategoryIds: [] });
  });

  it.each([
    ['getById', (s: ChildService) => s.getById('child-B', ME)],
    ['update', (s: ChildService) => s.update('child-B', { nameOrNickName: 'pwned' }, ME)],
    ['updateInterests', (s: ChildService) => s.updateInterests('child-B', [], [], ME)],
    ['updateInterestTags', (s: ChildService) => s.updateInterestTags('child-B', [], ME)],
    ['delete', (s: ChildService) => s.delete('child-B', ME)],
  ])("%s on another family's child → 404, no write", async (_n, call) => {
    await expect(call(childService())).rejects.toMatchObject({ statusCode: 404 });
    expect(children.update).not.toHaveBeenCalled();
    expect(children.updateInterests).not.toHaveBeenCalled();
    expect(children.updateInterestTags).not.toHaveBeenCalled();
    expect(children.delete).not.toHaveBeenCalled();
  });

  it('allows the owner', async () => {
    children.getById.mockResolvedValue({ id: 'child-A', parentId: ME, interestCategoryIds: [], interestSubCategoryIds: [] });
    await childService().update('child-A', { nameOrNickName: 'ok' }, ME);
    expect(children.update).toHaveBeenCalledWith('child-A', { nameOrNickName: 'ok' });
  });
});

describe('WishlistService ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wishlists.getById.mockResolvedValue({ id: 'w-B', parentId: OTHER, childId: 'child-B' });
  });

  it.each([
    ['delete', (s: WishlistService) => s.delete('w-B', ME)],
    ['getEnrichedItems', (s: WishlistService) => s.getEnrichedItems('w-B', ME)],
    ['addItem', (s: WishlistService) => s.addItem('w-B', { opportunityId: 'v1', opportunityType: 'venue' }, ME)],
    ['removeItem', (s: WishlistService) => s.removeItem('w-B#venue#v1', ME)],
  ])("%s on another family's wishlist → 404, no write", async (_n, call) => {
    await expect(call(new WishlistService())).rejects.toMatchObject({ statusCode: 404 });
    expect(wishlists.delete).not.toHaveBeenCalled();
    expect(wishlists.addItem).not.toHaveBeenCalled();
    expect(wishlists.removeItem).not.toHaveBeenCalled();
  });

  it("create rejects attaching a wishlist to another family's child", async () => {
    children.getById.mockResolvedValue({ id: 'child-B', parentId: OTHER });
    await expect(new WishlistService().create({ name: 'x', color: '#fff', parentId: ME, childId: 'child-B' }))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(wishlists.create).not.toHaveBeenCalled();
  });
});

describe('Visit intentions / interactions ownership', () => {
  beforeEach(() => vi.clearAllMocks());

  it("can't delete another family's visit intention", async () => {
    await expect(new VisitIntentionService().remove(`${OTHER}#venue#v1`, ME)).rejects.toMatchObject({ statusCode: 404 });
    expect(intentions.delete).not.toHaveBeenCalled();
  });
  it("can't delete another family's interaction", async () => {
    await expect(new OpportunityInteractionService().remove(`${OTHER}#venue#v1`, ME)).rejects.toMatchObject({ statusCode: 404 });
    expect(interactions.delete).not.toHaveBeenCalled();
  });
  it('can delete own records', async () => {
    await new VisitIntentionService().remove(`${ME}#venue#v1`, ME);
    await new OpportunityInteractionService().remove(`${ME}#venue#v1`, ME);
    expect(intentions.delete).toHaveBeenCalledWith(`${ME}#venue#v1`);
    expect(interactions.delete).toHaveBeenCalledWith(`${ME}#venue#v1`);
  });
});
