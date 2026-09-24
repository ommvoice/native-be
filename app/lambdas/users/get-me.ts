import middy from '@middy/core';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../../repositories/user.repository';
import { ParentRepository } from '../../repositories/parent.repository';
import { ChildService } from '../../services/child.service';
import { ChildRepository } from '../../repositories/child.repository';
import { InterestRepository } from '../../repositories/interest.repository';
import { WishlistService } from '../../services/wishlist.service';
import { getAuthUser } from '../../shared/middleware/auth-guard';
import { errorHandler } from '../../shared/middleware/error-handler';
import { ok } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';

const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sub }    = getAuthUser(event);
  const userRepo   = new UserRepository();
  const parentRepo = new ParentRepository();

  const user = await userRepo.getBySub(sub);
  if (!user) throw new AppError(401, 'User not found');

  const parent = user.role === 'PARENT' ? await parentRepo.getByUserId(user.id) : null;

  // Lazy guest-child expiry sweep — runs once per session restore (this is the client's own
  // "priority: high" call on launch), not a real-time TTL. See ChildService.deleteExpiredGuests().
  // Best-effort: never let a sweep failure fail login itself.
  if (parent) {
    const childService = new ChildService(new ChildRepository(), new InterestRepository(), new ParentRepository(), new WishlistService());
    try {
      await childService.deleteExpiredGuests(parent.id);
    } catch {
      // swallow — the guest just stays around until the next /me call sweeps it instead.
    }
  }

  return ok({ ...user, parent: parent ?? null });
};

export const handler = middy(baseHandler)
  .use(errorHandler());
