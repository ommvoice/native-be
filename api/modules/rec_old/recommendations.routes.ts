import express from "express";
import { RecommendationsRepository } from "./recommendations.repository.js";
import { RecommendationsService } from "./recommendations.service.js";
import { RecommendationsController } from "./recommendations.controller.js";
import asyncHandler from "../../shared/utils/asyncHandler.js";

const router = express.Router();
const repository = new RecommendationsRepository();
const service = new RecommendationsService(repository);
const controller = new RecommendationsController(service);

/**
 * @swagger
 * /recommendations/{parentId}:
 *   get:
 *     summary: Get personalised place recommendations for a family
 *     description: >
 *       Scores and ranks opportunities (parks, farms, trails, etc.)
 *       based on the family's children ages, distance from the query latitude and parent profile longitude,
 *       cost (free vs paid), effort suitability, and accessibility needs.
 *       Maximum search distance comes from the parent profile `searchRadius` (miles), not from query params.
 *       Longitude is taken from the parent profile, not the query string.
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The parent's ID (children will be looked up automatically).
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Current latitude of the family (longitude comes from the parent profile).
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated category filter (e.g. "animal_encounters,scenic_walks").
 *     responses:
 *       200:
 *         description: Ranked list of recommended opportunities.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       distanceMiles:
 *                         type: number
 *                         description: Great-circle distance in miles (UK).
 *                       score:
 *                         type: integer
 *                       scoreBreakdown:
 *                         type: object
 *       400:
 *         description: No children registered for this parent.
 *       404:
 *         description: Parent not found.
 */
router.get("/:parentId", asyncHandler(controller.getRecommendations));

export default router;
