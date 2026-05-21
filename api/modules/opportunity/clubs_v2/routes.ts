import express from "express";
import { OpportunityClubV2Repository } from "./repository.js";
import { OpportunityClubV2Service } from "./service.js";
import { OpportunityClubV2Controller } from "./controller.js";
import { createOpportunityClubV2Schema, validateBody } from "./schema.js";

const router = express.Router();
const repository = new OpportunityClubV2Repository();
const service = new OpportunityClubV2Service(repository);
const controller = new OpportunityClubV2Controller(service);

/**
 * @swagger
 * /opportunity/clubs_v2:
 *   get:
 *     tags:
 *       - Opportunity Clubs V2
 *     summary: List all v2 club opportunity records
 *     responses:
 *       200:
 *         description: Array of club v2 records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpportunityClubV2Response'
 *   post:
 *     tags:
 *       - Opportunity Clubs V2
 *     summary: Create a v2 club opportunity record
 *     description: |
 *       Stores spreadsheet-style club fields. `themeSlug` and `themeVariantSlug` are stored
 *       directly and echoed back in the `theme` / `themeVariant` response objects.
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
 *               clubName:
 *                 type: string
 *               themeSlug:
 *                 type: string
 *               themeVariantSlug:
 *                 type: string
 *               opportunityType:
 *                 type: string
 *                 enum: [venue, event, club, route]
 *                 default: club
 *               clubDescription:
 *                 type: string
 *                 nullable: true
 *               clubFormat:
 *                 type: string
 *                 nullable: true
 *               clubCommittment:
 *                 type: string
 *                 nullable: true
 *               clubFrequency:
 *                 type: string
 *                 nullable: true
 *               latitude:
 *                 type: string
 *                 nullable: true
 *               longitude:
 *                 type: string
 *                 nullable: true
 *               clubPostcode:
 *                 type: string
 *                 nullable: true
 *               clubStartDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               clubEndDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               clubAgeSuitabilityUnder1S:
 *                 type: boolean
 *                 nullable: true
 *               clubAgeSuitability1To2Years:
 *                 type: boolean
 *                 nullable: true
 *               clubAgeSuitability3To4Years:
 *                 type: boolean
 *                 nullable: true
 *               clubAgeSuitability5To7Years:
 *                 type: boolean
 *                 nullable: true
 *               clubAgeSuitability8To12Years:
 *                 type: boolean
 *                 nullable: true
 *               clubAgeSuitabilityOver13Years:
 *                 type: boolean
 *                 nullable: true
 *               clubAgeSuitabilityAdults:
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
 *               $ref: '#/components/schemas/OpportunityClubV2Response'
 *       400:
 *         description: Validation error
 */
router.get("/clubs_v2", controller.getAll);
router.post("/clubs_v2", validateBody(createOpportunityClubV2Schema), controller.create);

/**
 * @swagger
 * /opportunity/clubs_v2/{id}:
 *   get:
 *     tags:
 *       - Opportunity Clubs V2
 *     summary: Get a v2 club opportunity record by ID
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
 *         description: Club v2 record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpportunityClubV2Response'
 *       404:
 *         description: Not found
 */
router.get("/clubs_v2/:id", controller.getById);

export default router;
