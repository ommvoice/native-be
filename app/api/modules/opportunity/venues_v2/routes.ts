import express from "express";
import { OpportunityVenuesV2Repository } from "./repository.js";
import { OpportunityVenuesV2Service } from "./service.js";
import { OpportunityVenuesV2Controller } from "./controller.js";
import { createOpportunityVenuesV2Schema, validateBody } from "./schema.js";

const router = express.Router();
const repository = new OpportunityVenuesV2Repository();
const service = new OpportunityVenuesV2Service(repository);
const controller = new OpportunityVenuesV2Controller(service);

/**
 * @swagger
 * /opportunity/venues_v2:
 *   get:
 *     tags:
 *       - Opportunity Venues V2
 *     summary: List all v2 venue opportunity records
 *     responses:
 *       200:
 *         description: Array of venue v2 records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpportunityVenuesV2Response'
 *   post:
 *     tags:
 *       - Opportunity Venues V2
 *     summary: Create a v2 venue opportunity record
 *     description: |
 *       Stores spreadsheet-style venue fields. `themeSlug` and `themeVariantSlug` are stored
 *       directly and echoed back in the `theme` / `themeVariant` response objects.
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
 *               venueName:
 *                 type: string
 *               themeSlug:
 *                 type: string
 *               themeVariantSlug:
 *                 type: string
 *               venueDescription:
 *                 type: string
 *                 nullable: true
 *               venuePostcode:
 *                 type: string
 *                 nullable: true
 *               latitude:
 *                 type: string
 *                 nullable: true
 *               longitude:
 *                 type: string
 *                 nullable: true
 *               venueSchedulePattern:
 *                 type: string
 *                 nullable: true
 *               venueFixedDailyTimings:
 *                 type: boolean
 *                 nullable: true
 *               venueEntryCost:
 *                 type: boolean
 *                 nullable: true
 *               ticketingRequirement:
 *                 type: boolean
 *                 nullable: true
 *               venueAgeSuitabilityUnder1Years:
 *                 type: boolean
 *                 nullable: true
 *               venueAgeSuitability1To2Years:
 *                 type: boolean
 *                 nullable: true
 *               venueAgeSuitability3To4Years:
 *                 type: boolean
 *                 nullable: true
 *               venueAgeSuitability5To7Years:
 *                 type: boolean
 *                 nullable: true
 *               venueAgeSuitability8To12Years:
 *                 type: boolean
 *                 nullable: true
 *               venueAgeSuitabilityOver13Years:
 *                 type: boolean
 *                 nullable: true
 *               venueAgeSuitabilityAdults:
 *                 type: boolean
 *                 nullable: true
 *               venueEstimatedDuration:
 *                 type: string
 *                 nullable: true
 *               image:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Record created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpportunityVenuesV2Response'
 *       400:
 *         description: Validation error
 */
router.get("/venues_v2", controller.getAll);
router.post("/venues_v2", validateBody(createOpportunityVenuesV2Schema), controller.create);

/**
 * @swagger
 * /opportunity/venues_v2/{id}:
 *   get:
 *     tags:
 *       - Opportunity Venues V2
 *     summary: Get a v2 venue opportunity record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: DynamoDB item ID
 *     responses:
 *       200:
 *         description: Venue v2 record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpportunityVenuesV2Response'
 *       404:
 *         description: Not found
 */
router.get("/venues_v2/:id", controller.getById);

export default router;
