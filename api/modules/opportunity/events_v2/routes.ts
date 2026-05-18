import express from "express";
import { OpportunityVenueV2Repository } from "./repository.js";
import { OpportunityVenueV2Service } from "./service.js";
import { OpportunityVenueV2Controller } from "./controller.js";
import {
  createOpportunityVenueV2Schema,
  validateBody,
} from "./schema.js";

const router = express.Router();
const repository = new OpportunityVenueV2Repository();
const service = new OpportunityVenueV2Service(repository);
const controller = new OpportunityVenueV2Controller(service);

/**
 * @swagger
 * /opportunity/events_v2:
 *   post:
 *     summary: Create an opportunity event (v2 import shape)
 *     description: Stores spreadsheet-style event fields in opportunity_events_v2; themeSlug + themeVariantSlug must exist for the given opportunityType (default event).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventName
 *               - themeSlug
 *               - themeVariantSlug
 *             properties:
 *               eventName: { type: string }
 *               themeSlug: { type: string }
 *               themeVariantSlug: { type: string }
 *               opportunityType: { type: string, enum: [venue, event, club, route] }
 *     responses:
 *       201:
 *         description: Row created
 *       400:
 *         description: Invalid body or unknown theme / variant
 *   get:
 *     summary: List opportunity event v2 import rows
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/events_v2",
  validateBody(createOpportunityVenueV2Schema),
  controller.create,
);
router.get("/events_v2", controller.getAll);

/**
 * @swagger
 * /opportunity/events_v2/{id}:
 *   get:
 *     summary: Get opportunity event (v2 import) by ID
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
router.get("/events_v2/:id", controller.getById);

export default router;
