import express from "express";
import { ParentRepository } from "./repository.js";
import { ParentService } from "./service.js";
import { ParentController } from "./controller.js";
import {
  getByIdSchema,
  updateInterestPreferencesSchema,
  validateBody,
  validateParams,
} from "./schema.js";

const router = express.Router();
const repository = new ParentRepository();
const service = new ParentService(repository);
const controller = new ParentController(service);

/**
 * @swagger
 * /parents/{id}:
 *   get:
 *     summary: Get parent by ID
 *     description: Retrieve a parent available in the platform by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Parent ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parent retrieved successfully
 *       404:
 *         description: Parent not found
 */
router.get("/:id", validateParams(getByIdSchema), controller.getById);

/**
 * @swagger
 * /parents/{id}/interest-preferences:
 *   patch:
 *     summary: Update parent interest categories and subcategories
 *     description: Replaces linked interest categories and subcategories. Each subcategory's parent category must appear in interestCategoryIds. Empty arrays clear that side.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interestCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               interestSubCategoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Parent updated with interest categories and subcategories
 *       400:
 *         description: Invalid body, unknown id, or subcategory not under a selected category
 *       404:
 *         description: Parent not found
 */
router.patch(
  "/:id/interest-preferences",
  validateParams(getByIdSchema),
  validateBody(updateInterestPreferencesSchema),
  controller.updateInterestPreferences,
);

/**
 * @swagger
 * /parents/{id}/search-radius/{searchRadius}:
 *   patch:
 *     summary: Update parent search radius
 *     description: Update the search radius for a parent by their ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Parent ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: searchRadius
 *         required: true
 *         description: New search radius value in kilometers
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Search radius updated successfully
 *       404:
 *         description: Parent not found
 *       400:
 *         description: Invalid request parameters
 */
router.patch("/:id/search-radius/:searchRadius", controller.updateSearchRadius);

export default router;
