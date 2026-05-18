import express from "express";
import { OpportunityRouteV2Repository } from "./repository.js";
import { OpportunityRouteV2Service } from "./service.js";
import { OpportunityRouteV2Controller } from "./controller.js";
import {
  createOpportunityRouteV2Schema,
  validateBody,
} from "./schema.js";

const router = express.Router();
const repository = new OpportunityRouteV2Repository();
const service = new OpportunityRouteV2Service(repository);
const controller = new OpportunityRouteV2Controller(service);

/**
 * @swagger
 * /opportunity/routes_v2:
 *   post:
 *     summary: Create an opportunity route (v2 import shape)
 *     description: Stores spreadsheet-style route fields; themeSlug + themeVariantSlug must exist on opportunity_theme / opportunity_theme_variant for the given opportunityType (default route).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeName
 *               - themeSlug
 *               - themeVariantSlug
 *             properties:
 *               routeName: { type: string }
 *               themeSlug: { type: string }
 *               themeVariantSlug: { type: string }
 *               opportunityType: { type: string, enum: [venue, event, club, route] }
 *     responses:
 *       201:
 *         description: Row created
 *       400:
 *         description: Invalid body or unknown theme / variant
 *   get:
 *     summary: List opportunity route v2 import rows
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/routes_v2",
  validateBody(createOpportunityRouteV2Schema),
  controller.create,
);
router.get("/routes_v2", controller.getAll);

/**
 * @swagger
 * /opportunity/routes_v2/{id}:
 *   get:
 *     summary: Get opportunity route (v2 import) by ID
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
 *         description: Not found
 */
router.get("/routes_v2/:id", controller.getById);

export default router;
