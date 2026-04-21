import express from "express";
import { ParentRepository } from "../parents/repository.js";
import { ChildrenController } from "./controller.js";
import { createChildSchema } from "./schema.js";
import { validateBody as validateBodyUsers } from "../users/schema.js";
import {
  getByIdSchema,
  updateInterestPreferencesSchema,
  validateBody,
  validateParams,
} from "../parents/schema.js";
import { ChildrenRepository } from "./repository.js";
import { ChildrenService } from "./service.js";

const router = express.Router();
const childrenRepository = new ChildrenRepository();
const parentRepository = new ParentRepository();
const service = new ChildrenService(parentRepository, childrenRepository);
const controller = new ChildrenController(service);

/**
 * @swagger
 * /children:
 *   post:
 *     summary: Add children to a parent
 *     description: Adds one or more children to an existing parent. Returns the IDs of the created children.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentId
 *               - children
 *             properties:
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the parent to add children to.
 *               children:
 *                 type: array
 *                 minItems: 1
 *                 description: List of children to create.
 *                 items:
 *                   type: object
 *                   required:
 *                     - nameOrNickName
 *                     - dateOfBirth
 *                   properties:
 *                     nameOrNickName:
 *                       type: string
 *                       description: Child nameOrNickName.
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       description: Child date of birth as ISO 8601 string.
 *     responses:
 *       201:
 *         description: Children created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ids:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uuid
 *                   description: IDs of the created children.
 *       400:
 *         description: Invalid input data.
 *       404:
 *         description: Parent not found.
 */
router.post("/", validateBodyUsers(createChildSchema), controller.create);

/**
 * @swagger
 * /children/{id}:
 *   get:
 *     summary: Get child by ID
 *     description: Returns the child with parent and interest preferences (categories and subcategories).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Child not found
 */
router.get("/:id", validateParams(getByIdSchema), controller.getById);

/**
 * @swagger
 * /children/{id}/interest-preferences:
 *   patch:
 *     summary: Update child interest categories and subcategories
 *     description: Replaces linked interest categories and subcategories. Each subcategory's parent category must appear in interestCategoryIds.
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
 *         description: Child updated
 *       400:
 *         description: Invalid body or subcategory not under a selected category
 *       404:
 *         description: Child not found
 */
router.patch(
  "/:id/interest-preferences",
  validateParams(getByIdSchema),
  validateBody(updateInterestPreferencesSchema),
  controller.updateInterestPreferences,
);

export default router;
