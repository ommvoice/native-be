import express from "express";
import { OpportunityRouteRepository } from "./repository.js";
import { OpportunityRouteService } from "./service.js";
import { OpportunityRouteController } from "./controller.js";
import {
  createOpportunityRouteSchema,
  validateBody,
} from "./schema.js";

const router = express.Router();
const repository = new OpportunityRouteRepository();
const service = new OpportunityRouteService(repository);
const controller = new OpportunityRouteController(service);

/**
 * @swagger
 * /opportunity/routes:
 *   post:
 *     summary: Create an opportunity route
 *     description: Creates a route with slug arrays and lookups validated against opportunity/routes/constants/*.ts and opportunity/common/constants/opportunity-*.ts.
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
 *               routeTypeSlug: { type: string, nullable: true }
 *               routeDistanceMiles: { type: number }
 *               routeSuitabilitySlugs: { type: array, items: { type: string } }
 *               terrainTypeSlugs: { type: array, items: { type: string } }
 *               difficultyRatingSlug: { type: string, nullable: true }
 *               activityGroupSlug: { type: string, nullable: true }
 *               startPointPostCode: { type: string }
 *               parkingProvisionSlug: { type: string, nullable: true }
 *               venueSettingSlug: { type: string, nullable: true }
 *               adultCost: { type: number }
 *               childCost: { type: number }
 *               infantCost: { type: number }
 *               generalFacilitySlugs: { type: array, items: { type: string } }
 *               kidsFacilitySlugs: { type: array, items: { type: string } }
 *               parentFacilitySlugs: { type: array, items: { type: string } }
 *               dogFacilitySlugs: { type: array, items: { type: string } }
 *               extraKitSlugs: { type: array, items: { type: string } }
 *               interestTags: { type: string }
 *               seasonalTagSlug: { type: string, nullable: true }
 *               seasonalHighlightSlugs: { type: array, items: { type: string } }
 *               highlightAttractionSlugs: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Route created
 *       400:
 *         description: Invalid body
 *   get:
 *     summary: List opportunity routes
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/routes",
  validateBody(createOpportunityRouteSchema),
  controller.create,
);
router.get("/routes", controller.getAll);

/**
 * @swagger
 * /opportunity/routes/{id}:
 *   get:
 *     summary: Get opportunity route by ID
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
router.get("/routes/:id", controller.getById);

export default router;
