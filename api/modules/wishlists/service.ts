import AppError from "../../shared/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { WishlistRepository } from "./repository.js";
import type { CreateWishlistBody, GetAllWishlistsQuery } from "./schema.js";

export class WishlistService {
  constructor(private wishlistRepository: WishlistRepository) {}

  async getAll(query: GetAllWishlistsQuery) {
    const { parentId, childId } = query;

    const parentOk = await this.wishlistRepository.parentExists(parentId);
    if (!parentOk) {
      throw new AppError(StatusCodes.NOT_FOUND, "Parent not found");
    }

    if (childId) {
      const ok = await this.wishlistRepository.childBelongsToParent(
        childId,
        parentId,
      );
      if (!ok) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "Child does not belong to this parent",
        );
      }
    }

    return this.wishlistRepository.findByParentId(parentId, childId);
  }

  async create(body: CreateWishlistBody) {
    const { parentId, childId, name, color, items } = body;

    const parentOk = await this.wishlistRepository.parentExists(parentId);
    if (!parentOk) {
      throw new AppError(StatusCodes.NOT_FOUND, "Parent not found");
    }

    const childOk = await this.wishlistRepository.childBelongsToParent(
      childId,
      parentId,
    );
    if (!childOk) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Child not found or does not belong to this parent",
      );
    }

    const venueIds = items
      .map((i) => i.opportunityVenueId)
      .filter((id): id is string => id != null && id !== "");
    const eventIds = items
      .map((i) => i.opportunityEventId)
      .filter((id): id is string => id != null && id !== "");
    const clubIds = items
      .map((i) => i.opportunityClubId)
      .filter((id): id is string => id != null && id !== "");
    const routeIds = items
      .map((i) => i.opportunityRouteId)
      .filter((id): id is string => id != null && id !== "");

    const refsOk = await this.wishlistRepository.opportunityIdsExist({
      venueIds,
      eventIds,
      clubIds,
      routeIds,
    });
    if (!refsOk) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "One or more opportunity ids are invalid",
      );
    }

    return this.wishlistRepository.create({
      parentId,
      childId,
      name,
      color,
      items,
    });
  }
}
