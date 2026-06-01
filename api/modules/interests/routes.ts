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
 *       Returns all interest categories. Each category's `themes` lists themes linked via
 *       `interestId` on the opportunity theme table. Themes are ordered by `slug`.
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
 *                   themes:
 *                     type: array
 *                     description: Themes for this interest category
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         slug:
 *                           type: string
 *                         name:
 *                           type: string
 */
router.get("/", controller.getAll);

export default router;
