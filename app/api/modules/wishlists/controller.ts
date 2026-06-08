import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { WishlistService } from "./service.js";
import type { CreateWishlistBody, GetAllWishlistsQuery } from "./schema.js";

export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const query = (req as Request & { validatedQuery: GetAllWishlistsQuery })
      .validatedQuery;
    const wishlists = await this.wishlistService.getAll(query);
    res.status(StatusCodes.OK).json(wishlists);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateWishlistBody;
    const wishlist = await this.wishlistService.create(body);
    res.status(StatusCodes.CREATED).json(wishlist);
  };
}
