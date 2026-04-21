import express from "express";
import { WishlistRepository } from "./repository.js";
import { WishlistService } from "./service.js";
import { WishlistController } from "./controller.js";
import {
  createWishlistBodySchema,
  getAllQuerySchema,
  validateBody,
  validateQuery,
} from "./schema.js";

const router = express.Router();
const repository = new WishlistRepository();
const service = new WishlistService(repository);
const controller = new WishlistController(service);

/**
 * @swagger
 * /wishlists:
 *   get:
 *     summary: List wishlists for a parent
 *     description: Returns wishlists for the given parent. Optionally filter by childId (must be a child of that parent).
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: childId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Invalid query
 *       404:
 *         description: Parent not found
 */
router.get("/", validateQuery(getAllQuerySchema), controller.getAll);

/**
 * @swagger
 * /wishlists:
 *   post:
 *     summary: Create a wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentId
 *               - childId
 *               - name
 *               - color
 *               - items
 *             properties:
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               childId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 description: Required. Each element must reference exactly one opportunity (venue, event, club, or route).
 *                 items:
 *                   type: object
 *                   properties:
 *                     opportunityVenueId:
 *                       type: string
 *                       format: uuid
 *                     opportunityEventId:
 *                       type: string
 *                       format: uuid
 *                     opportunityClubId:
 *                       type: string
 *                       format: uuid
 *                     opportunityRouteId:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Invalid body or child does not belong to parent
 *       404:
 *         description: Parent not found
 */
router.post("/", validateBody(createWishlistBodySchema), controller.create);

export default router;
