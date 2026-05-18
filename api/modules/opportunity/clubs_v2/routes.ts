import express from "express";
import { OpportunityClubV2Repository } from "./repository.js";
import { OpportunityClubV2Service } from "./service.js";
import { OpportunityClubV2Controller } from "./controller.js";
import {
  createOpportunityClubV2Schema,
  validateBody,
} from "./schema.js";

const router = express.Router();
const repository = new OpportunityClubV2Repository();
const service = new OpportunityClubV2Service(repository);
const controller = new OpportunityClubV2Controller(service);

/**
 * @swagger
 * /opportunity/clubs_v2:
 *   post:
 *     summary: Create an opportunity club (v2 import shape)
 *     description: Stores spreadsheet-style club fields; themeSlug + themeVariantSlug must exist on opportunity_theme / opportunity_theme_variant for the given opportunityType (default club).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clubName
 *               - themeSlug
 *               - themeVariantSlug
 *             properties:
 *               clubName: { type: string }
 *               themeSlug: { type: string }
 *               themeVariantSlug: { type: string }
 *               opportunityType: { type: string, enum: [venue, event, club, route] }
 *     responses:
 *       201:
 *         description: Row created
 *       400:
 *         description: Invalid body or unknown theme / variant
 *   get:
 *     summary: List opportunity club v2 import rows
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/clubs_v2",
  validateBody(createOpportunityClubV2Schema),
  controller.create,
);
router.get("/clubs_v2", controller.getAll);

/**
 * @swagger
 * /opportunity/clubs_v2/{id}:
 *   get:
 *     summary: Get opportunity club (v2 import) by ID
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
router.get("/clubs_v2/:id", controller.getById);

export default router;
