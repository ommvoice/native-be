import express from "express";
import { OpportunityClubRepository } from "./repository.js";
import { OpportunityClubService } from "./service.js";
import { OpportunityClubController } from "./controller.js";
import { createOpportunityClubSchema } from "./schema.js";
import { validateBody } from "../events/schema.js";

const router = express.Router();
const repository = new OpportunityClubRepository();
const service = new OpportunityClubService(repository);
const controller = new OpportunityClubController(service);

/**
 * @swagger
 * /opportunity/clubs:
 *   post:
 *     summary: Create an opportunity club
 *     description: Creates a club with slug arrays and lookups validated against opportunity/clubs/constants/*.ts and opportunity/common/constants/opportunity-*.ts.
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
 *               startTime: { type: string, example: "09:00" }
 *               finishTime: { type: string }
 *               dayOfWeekSlug: { type: string, nullable: true }
 *               activityGroupSlug: { type: string, nullable: true }
 *               clubFormatSlug: { type: string, nullable: true }
 *               clubFrequencySlug: { type: string, nullable: true }
 *               commitmentSlug: { type: string, nullable: true }
 *               skillAreaSlug: { type: string, nullable: true }
 *               skillAreaVariant: { type: string }
 *               abilityLevelSlug: { type: string, nullable: true }
 *               parkingProvisionSlug: { type: string, nullable: true }
 *               venueSettingSlug: { type: string, nullable: true }
 *               adultCost: { type: number }
 *               childCost: { type: number }
 *               infantCost: { type: number }
 *               generalFacilitySlugs: { type: array, items: { type: string } }
 *               kidsFacilitySlugs: { type: array, items: { type: string } }
 *               parentFacilitySlugs: { type: array, items: { type: string } }
 *               ageSuitabilitySlugs: { type: array, items: { type: string } }
 *               extraKitSlugs: { type: array, items: { type: string } }
 *               interestTags: { type: string }
 *               seasonalTagSlug: { type: string, nullable: true }
 *               seasonalHighlightSlugs: { type: array, items: { type: string } }
 *               highlightAttractionSlugs: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Club created
 *       400:
 *         description: Invalid body
 *   get:
 *     summary: List opportunity clubs
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/clubs",
  validateBody(createOpportunityClubSchema),
  controller.create,
);
router.get("/clubs", controller.getAll);

/**
 * @swagger
 * /opportunity/clubs/{id}:
 *   get:
 *     summary: Get opportunity club by ID
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
router.get("/clubs/:id", controller.getById);

export default router;
