import express from "express";
import { FacilitiesRepository } from "./repository.js";
import { FacilitiesService } from "./service.js";
import { FacilitiesController } from "./controller.js";

const router = express.Router();
const repository = new FacilitiesRepository();
const service = new FacilitiesService(repository);
const controller = new FacilitiesController(service);

/**
 * @swagger
 * /facilities:
 *   get:
 *     summary: List facilities
 *     description: |
 *       Returns facilities grouped by `type` (GENERAL, PARENT, KID, DOG). Within each group,
 *       items are ordered by `slug`. Each facility has `slug` and human-readable `label`.
 *     tags:
 *       - Facilities
 *     responses:
 *       200:
 *         description: Facilities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [GENERAL, PARENT, KID, DOG]
 *                   facilities:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         slug:
 *                           type: string
 *                         label:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 */
router.get("/", controller.getAll);

export default router;
