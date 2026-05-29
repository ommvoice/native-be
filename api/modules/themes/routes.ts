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
 *       Returns all rows from `opportunity-themes` with nested `variants` from `opportunity-theme-variants`
 *       (matched by `themeId`). Themes are ordered by `slug`, then `recordType`, then `sortOrder`.
 *       Variants are ordered by `sortOrder`, then `slug`.
 *       The service returns **one row per `slug`**: if Dynamo has multiple rows for the same slug (different
 *       `recordType`), the row with the **largest `variants` length** is kept; ties keep the first in that sort order.
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
 *                   recordType:
 *                     type: string
 *                     enum: [route, venue, club, event]
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
