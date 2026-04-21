import express from "express";
import { AllOpportunitiesController } from "./controller.js";
import { AllOpportunitiesService } from "./service.js";

const router = express.Router();
const service = new AllOpportunitiesService();
const controller = new AllOpportunitiesController(service);

/**
 * @swagger
 * /opportunity/all:
 *   get:
 *     summary: List all opportunities
 *     description: Returns events, clubs, routes, and venues in one response (same enriched shapes as each type’s list endpoint).
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events: { type: array, items: { type: object } }
 *                 clubs: { type: array, items: { type: object } }
 *                 routes: { type: array, items: { type: object } }
 *                 venues: { type: array, items: { type: object } }
 */
router.get("/all", controller.getAll);

export default router;
