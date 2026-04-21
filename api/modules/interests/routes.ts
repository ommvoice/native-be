import express from "express";
import { InterestRepository } from "./repository.js";
import { InterestService } from "./service.js";
import { InterestController } from "./controller.js";

const router = express.Router();
const repository = new InterestRepository();
const service = new InterestService(repository);
const controller = new InterestController(service);

/**
 * @swagger
 * /interests:
 *   get:
 *     summary: List interest categories
 *     description: |
 *       Returns all interest categories. Each category's `subCategories` contains only **root**
 *       subcategories; each node may include nested `subCategories` (same shape), matching the
 *       hierarchical seed data. Nodes are ordered by `slug` at each level. `suitableForAge` is
 *       null when not set.
 *     responses:
 *       200:
 *         description: Interest categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   slug:
 *                     type: string
 *                   name:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   subCategories:
 *                     type: array
 *                     description: Root-level subcategories (may nest arbitrarily)
 *                     items:
 *                       $ref: '#/components/schemas/InterestSubCategoryTree'
 */
router.get("/", controller.getAll);

export default router;
