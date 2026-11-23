import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getAuthUser } from '../middleware/auth-guard';
import { AppError } from '../errors/app-error';
import { UserRepository } from '../../repositories/user.repository';
import { ParentRepository, type ParentRecord } from '../../repositories/parent.repository';

/**
 * Object-level authorization helpers.
 *
 * The caller's identity comes ONLY from the API Gateway authorizer (`sub` claim). A `parentId`
 * sent by the client (path/query/body) is never trusted: it's either ignored or, when present,
 * must equal the caller's own parent id — otherwise 403. This closes the IDOR where any signed-in
 * user could read/modify another family's parent, children, wishlists, reminders, etc.
 */

const userRepo = new UserRepository();
const parentRepo = new ParentRepository();

/** The signed-in user's parent profile. 401 when there's no authenticated sub, 404 when the user
 * has no parent profile. */
export async function getCurrentParent(event: APIGatewayProxyEvent): Promise<ParentRecord> {
  const { sub } = getAuthUser(event);
  if (!sub) throw new AppError(401, 'Unauthorized');
  const user = await userRepo.getBySub(sub);
  if (!user) throw new AppError(401, 'Unauthorized');
  const parent = await parentRepo.getByUserId(user.id);
  if (!parent) throw new AppError(404, 'Parent profile not found');
  return parent;
}

/** Throws 403 when a client-supplied parentId is present and isn't the caller's own. */
export function assertParentIdMatches(claimedParentId: string | null | undefined, parent: ParentRecord): void {
  if (claimedParentId && claimedParentId !== parent.id) {
    throw new AppError(403, 'Forbidden');
  }
}

/**
 * The caller's own parent id, cross-checked against an optional client-supplied one
 * (kept for backward compatibility with app builds that still send `parentId`).
 */
export async function resolveParentId(
  event: APIGatewayProxyEvent,
  claimedParentId?: string | null,
): Promise<string> {
  const parent = await getCurrentParent(event);
  assertParentIdMatches(claimedParentId, parent);
  return parent.id;
}

/** Resource ownership check: 404 (not 403) so another family's record ids can't be probed. */
export function assertOwned<T extends { parentId: string }>(
  record: T | null | undefined,
  parentId: string,
  notFoundMessage: string,
): T {
  if (!record || record.parentId !== parentId) throw new AppError(404, notFoundMessage);
  return record;
}
