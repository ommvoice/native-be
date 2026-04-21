import express from "express";
import { OpportunityVenueRepository } from "./repository.js";
import { OpportunityVenueService } from "./service.js";
import { OpportunityVenueController } from "./controller.js";
import {
  createOpportunityVenueSchema,
  validateBody,
} from "./schema.js";

const router = express.Router();
const repository = new OpportunityVenueRepository();
const service = new OpportunityVenueService(repository);
const controller = new OpportunityVenueController(service);

/**
 * @swagger
 * /opportunity/venues:
 *   post:
 *     summary: Create an opportunity venue
 *     description: Creates a venue with facility slug arrays (stored via M2M); scalars validated against opportunity/common/constants/opportunity-*.ts.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - themeSlug
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               themeSlug: { type: string }
 *               themeVariantSlug: { type: string, nullable: true }
 *               venuePostCode: { type: string }
 *               openingDaysAndTimes: { type: string }
 *               openingExclusions: { type: string }
 *               activityGroupSlug: { type: string, nullable: true }
 *               terrainTypeSlug: { type: string, nullable: true }
 *               parkingProvisionSlug: { type: string, nullable: true }
 *               venueSettingSlug: { type: string, nullable: true }
 *               adultCost: { type: number }
 *               childCost: { type: number }
 *               infantCost: { type: number }
 *               interestTags: { type: string }
 *               estimatedTimeToSpend: { type: string }
 *               seasonalTagSlug: { type: string, nullable: true }
 *               generalFacilitySlugs: { type: array, items: { type: string } }
 *               kidsFacilitySlugs: { type: array, items: { type: string } }
 *               parentFacilitySlugs: { type: array, items: { type: string } }
 *               ageSuitabilitySlugs: { type: array, items: { type: string } }
 *               extraKitSlugs: { type: array, items: { type: string } }
 *               seasonalHighlightSlugs: { type: array, items: { type: string } }
 *               highlightAttractionSlugs: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Venue created
 *       400:
 *         description: Invalid body
 *   get:
 *     summary: List opportunity venues
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/venues",
  validateBody(createOpportunityVenueSchema),
  controller.create,
);
router.get("/venues", controller.getAll);

/**
 * @swagger
 * /opportunity/venues/{id}:
 *   get:
 *     summary: Get opportunity venue by ID
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
router.get("/venues/:id", controller.getById);

export default router;
