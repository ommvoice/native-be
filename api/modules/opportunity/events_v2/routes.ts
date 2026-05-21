import express from "express";
import { OpportunityVenueV2Repository } from "./repository.js";
import { OpportunityVenueV2Service } from "./service.js";
import { OpportunityVenueV2Controller } from "./controller.js";
import { createOpportunityVenueV2Schema, validateBody } from "./schema.js";

const router = express.Router();
const repository = new OpportunityVenueV2Repository();
const service = new OpportunityVenueV2Service(repository);
const controller = new OpportunityVenueV2Controller(service);

/**
 * @swagger
 * /opportunity/events_v2:
 *   get:
 *     tags:
 *       - Opportunity Events V2
 *     summary: List all v2 event opportunity records
 *     responses:
 *       200:
 *         description: Array of event v2 records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpportunityEventV2Response'
 *   post:
 *     tags:
 *       - Opportunity Events V2
 *     summary: Create a v2 event opportunity record
 *     description: |
 *       Stores spreadsheet-style event fields. `themeSlug` and `themeVariantSlug` are stored
 *       directly and echoed back in the `theme` / `themeVariant` response objects.
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
 *               eventName:
 *                 type: string
 *               themeSlug:
 *                 type: string
 *               themeVariantSlug:
 *                 type: string
 *               opportunityType:
 *                 type: string
 *                 enum: [venue, event, club, route]
 *                 default: event
 *               eventDescription:
 *                 type: string
 *                 nullable: true
 *               eventPostcode:
 *                 type: string
 *                 nullable: true
 *               latitude:
 *                 type: string
 *                 nullable: true
 *               longitude:
 *                 type: string
 *                 nullable: true
 *               eventStartDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               eventEndDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               ticketSalesStartDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               eventAgeSuitabilityUnder1S:
 *                 type: boolean
 *                 nullable: true
 *               eventAgeSuitability1To2Years:
 *                 type: boolean
 *                 nullable: true
 *               eventAgeSuitability3To4Years:
 *                 type: boolean
 *                 nullable: true
 *               eventAgeSuitability5To7Years:
 *                 type: boolean
 *                 nullable: true
 *               eventAgeSuitability8To12Years:
 *                 type: boolean
 *                 nullable: true
 *               eventAgeSuitabilityOver13Years:
 *                 type: boolean
 *                 nullable: true
 *               eventAgeSuitabilityAdults:
 *                 type: boolean
 *                 nullable: true
 *               ticketingRequirement:
 *                 type: boolean
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
 *               $ref: '#/components/schemas/OpportunityEventV2Response'
 *       400:
 *         description: Validation error
 */
router.get("/events_v2", controller.getAll);
router.post("/events_v2", validateBody(createOpportunityVenueV2Schema), controller.create);

/**
 * @swagger
 * /opportunity/events_v2/{id}:
 *   get:
 *     tags:
 *       - Opportunity Events V2
 *     summary: Get a v2 event opportunity record by ID
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
 *         description: Event v2 record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpportunityEventV2Response'
 *       404:
 *         description: Not found
 */
router.get("/events_v2/:id", controller.getById);

export default router;
