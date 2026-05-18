import express from "express";
import { OpportunityVenuesV2Repository } from "./repository.js";
import { OpportunityVenuesV2Service } from "./service.js";
import { OpportunityVenuesV2Controller } from "./controller.js";
import {
  createOpportunityVenuesV2Schema,
  validateBody,
} from "./schema.js";

const router = express.Router();
const repository = new OpportunityVenuesV2Repository();
const service = new OpportunityVenuesV2Service(repository);
const controller = new OpportunityVenuesV2Controller(service);

/**
 * @swagger
 * /opportunity/venues_v2:
 *   post:
 *     summary: Create an opportunity venue (v2 import shape)
 *     description: Stores spreadsheet-style fields; themeSlug + themeVariantSlug must resolve to an opportunity_theme / opportunity_theme_variant with recordType venue.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - venueName
 *               - themeSlug
 *               - themeVariantSlug
 *             properties:
 *               venueName: { type: string }
 *               themeSlug: { type: string }
 *               themeVariantSlug: { type: string }
 *     responses:
 *       201:
 *         description: Venue created
 *       400:
 *         description: Invalid body or unknown theme / variant
 *   get:
 *     summary: List opportunity venues (v2)
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/venues_v2",
  validateBody(createOpportunityVenuesV2Schema),
  controller.create,
);
router.get("/venues_v2", controller.getAll);

/**
 * @swagger
 * /opportunity/venues_v2/{id}:
 *   get:
 *     summary: Get opportunity venue (v2) by ID
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
router.get("/venues_v2/:id", controller.getById);

export default router;
