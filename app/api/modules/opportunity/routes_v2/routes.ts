import express from "express";
import { OpportunityRouteV2Repository } from "./repository.js";
import { OpportunityRouteV2Service } from "./service.js";
import { OpportunityRouteV2Controller } from "./controller.js";
import { createOpportunityRouteV2Schema, validateBody } from "./schema.js";

const router = express.Router();
const repository = new OpportunityRouteV2Repository();
const service = new OpportunityRouteV2Service(repository);
const controller = new OpportunityRouteV2Controller(service);

/**
 * @swagger
 * /opportunity/routes_v2:
 *   get:
 *     tags:
 *       - Opportunity Routes V2
 *     summary: List all v2 route opportunity records
 *     responses:
 *       200:
 *         description: Array of route v2 records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpportunityRouteV2Response'
 *   post:
 *     tags:
 *       - Opportunity Routes V2
 *     summary: Create a v2 route opportunity record
 *     description: |
 *       Stores spreadsheet-style route fields. `themeSlug` and `themeVariantSlug` are stored
 *       directly and echoed back in the `theme` / `themeVariant` response objects.
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
 *               routeName:
 *                 type: string
 *               themeSlug:
 *                 type: string
 *               themeVariantSlug:
 *                 type: string
 *               opportunityType:
 *                 type: string
 *                 enum: [venue, event, club, route]
 *                 default: route
 *               routeDescription:
 *                 type: string
 *                 nullable: true
 *               routeType:
 *                 type: string
 *                 nullable: true
 *               routeDistance:
 *                 type: string
 *                 nullable: true
 *               routeTerrainType:
 *                 type: string
 *                 nullable: true
 *               routeDifficulty:
 *                 type: string
 *                 nullable: true
 *               routePostcode:
 *                 type: string
 *                 nullable: true
 *               latitude:
 *                 type: string
 *                 nullable: true
 *               longitude:
 *                 type: string
 *                 nullable: true
 *               routeAgeSuitabilityUnder1S:
 *                 type: boolean
 *                 nullable: true
 *               routeAgeSuitability1To2Years:
 *                 type: boolean
 *                 nullable: true
 *               routeAgeSuitability3To4Years:
 *                 type: boolean
 *                 nullable: true
 *               routeAgeSuitability5To7Years:
 *                 type: boolean
 *                 nullable: true
 *               routeAgeSuitability8To12Years:
 *                 type: boolean
 *                 nullable: true
 *               routeAgeSuitabilityOver13Years:
 *                 type: boolean
 *                 nullable: true
 *               routeAgeSuitabilityAdults:
 *                 type: boolean
 *                 nullable: true
 *               routeEstimatedDuration:
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
 *               $ref: '#/components/schemas/OpportunityRouteV2Response'
 *       400:
 *         description: Validation error
 */
router.get("/routes_v2", controller.getAll);
router.post("/routes_v2", validateBody(createOpportunityRouteV2Schema), controller.create);

/**
 * @swagger
 * /opportunity/routes_v2/{id}:
 *   get:
 *     tags:
 *       - Opportunity Routes V2
 *     summary: Get a v2 route opportunity record by ID
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
 *         description: Route v2 record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpportunityRouteV2Response'
 *       404:
 *         description: Not found
 */
router.get("/routes_v2/:id", controller.getById);

export default router;
