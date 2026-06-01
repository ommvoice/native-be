import express from "express";
import { ThemeRepository } from "./repository.js";
import { ThemeService } from "./service.js";
import { ThemeController } from "./controller.js";

const router = express.Router();
const repository = new ThemeRepository();
const service = new ThemeService(repository);
const controller = new ThemeController(service);

/**
 * @swagger
 * /themes:
 *   get:
 *     summary: List opportunity themes
 *     description: |
 *       Returns logical themes from `opportunity-themes` with nested `variants` from
 *       `opportunity-theme-variants`.
 *
 *       Themes seeded for an interest category include `interestId`. Category-agnostic themes
 *       (legacy / incremental global seed) have `interestId: null`.
 *
 *       By default only themes linked to an interest category (`interestId` set) are returned.
 *       Pass `linkedOnly=false` to include legacy unlinked rows.
 *
 *       Optional filters (for incremental category seeds):
 *       - `interestSlug` — e.g. `nature_exploration` (returns exactly that category's themes)
 *       - `interestId` — interest category UUID
 *     parameters:
 *       - in: query
 *         name: linkedOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: When true, omit themes with no interestId
 *       - in: query
 *         name: interestSlug
 *         schema:
 *           type: string
 *         description: Filter to themes linked to this interest category slug
 *       - in: query
 *         name: interestId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter to themes linked to this interest category id
 *     responses:
 *       200:
 *         description: Opportunity themes retrieved successfully
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
 *                   interestId:
 *                     type: string
 *                     format: uuid
 *                     nullable: true
 *                   isActive:
 *                     type: boolean
 *                   sortOrder:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   variants:
 *                     type: array
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
 *                         applicableTypes:
 *                           type: string
 *                           nullable: true
 *                         description:
 *                           type: string
 *                           nullable: true
 *                         isActive:
 *                           type: boolean
 *                         sortOrder:
 *                           type: number
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 */
router.get("/", controller.getAll);

export default router;
