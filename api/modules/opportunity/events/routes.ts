import express from "express";
import { OpportunityEventRepository } from "./repository.js";
import { OpportunityEventService } from "./service.js";
import { OpportunityEventController } from "./controller.js";
import {
  createOpportunityEventSchema,
  validateBody,
} from "./schema.js";

const router = express.Router();
const repository = new OpportunityEventRepository();
const service = new OpportunityEventService(repository);
const controller = new OpportunityEventController(service);

/**
 * @swagger
 * /opportunity/events:
 *   post:
 *     summary: Create an opportunity event
 *     description: Creates a new opportunity event with optional related lookup slugs.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - themeSlug
 *               - eventTypeSlug
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               themeSlug:
 *                 type: string
 *                 description: One of the application-defined event theme slugs (see opportunity/common/constants/opportunity-theme.ts)
 *               themeVariantSlug:
 *                 type: string
 *                 nullable: true
 *                 description: Optional; one of the application-defined variant slugs (see opportunity/common/constants/opportunity-theme-variant.ts)
 *               eventTypeSlug:
 *                 type: string
 *                 description: One of the application-defined slugs (see opportunity/common/constants/opportunity-types.ts); e.g. festival, country_show
 *               activityGroupSlug:
 *                 type: string
 *                 nullable: true
 *                 description: Optional; one of the application-defined activity group slugs (see opportunity/common/constants/opportunity-activity-group.ts)
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               finishTime:
 *                 type: string
 *               venuePostCode:
 *                 type: string
 *               parkingProvisionSlug:
 *                 type: string
 *                 nullable: true
 *                 description: Optional; free_car_park or paid_car_park (see opportunity/common/constants/opportunity-parking-provision.ts)
 *               venueSettingSlug:
 *                 description: Optional event-only slug; see opportunity/common/constants/opportunity-venue-setting.ts (inside, outside). No DB FK; response includes venueSetting { slug, label } when set.
 *                 type: string
 *                 nullable: true
 *               generalFacilitySlugs:
 *                 type: array
 *                 description: Slugs from opportunity/common/constants/opportunity-general-facility.ts (e.g. toilets, picnic_benches)
 *                 items:
 *                   type: string
 *               kidsFacilitySlugs:
 *                 type: array
 *                 description: Slugs from opportunity/common/constants/opportunity-kids-facility.ts (e.g. activity_trail, play_equipment)
 *                 items:
 *                   type: string
 *               parentFacilitySlugs:
 *                 type: array
 *                 description: Slugs from opportunity/common/constants/opportunity-parent-facility.ts (e.g. hot_drinks, wifi)
 *                 items:
 *                   type: string
 *               adultCost:
 *                 type: number
 *               childCost:
 *                 type: number
 *               infantCost:
 *                 type: number
 *               ageSuitabilitySlugs:
 *                 description: Event-only age bands; slugs from opportunity/common/constants/opportunity-age-suitability.ts (under_1, age_1–age_12, age_13_plus, age_16_plus). Stored on the event row; response also includes ageSuitabilities { slug, label }.
 *                 type: array
 *                 items:
 *                   type: string
 *               skillAreaSlug:
 *                 description: Optional event-only slug; see opportunity/common/constants/opportunity-skill-area.ts. No DB FK; response includes skillArea { slug, label } when set.
 *                 type: string
 *                 nullable: true
 *               skillAreaVariant:
 *                 type: string
 *               abilityLevelSlug:
 *                 description: Optional event-only slug; see opportunity/common/constants/opportunity-ability-level.ts. No DB FK; response includes abilityLevel { slug, label } when set.
 *                 type: string
 *                 nullable: true
 *               extraKitSlugs:
 *                 description: Event-only extra kit slugs; see opportunity/common/constants/opportunity-extra-kit.ts. Stored on the event row; response also includes extraKits { slug, label }.
 *                 type: array
 *                 items:
 *                   type: string
 *               interestTags:
 *                 type: string
 *               seasonalTagSlug:
 *                 description: Optional event-only slug; see opportunity/common/constants/opportunity-seasonal-tag.ts. No DB FK; response includes seasonalTag { slug, label } when set.
 *                 type: string
 *               seasonalHighlightSlugs:
 *                 description: Event-only seasonal highlight slugs; see opportunity/common/constants/opportunity-seasonal-highlight.ts. Stored on the event row; response also includes seasonalHighlights { slug, label }.
 *                 type: array
 *                 items:
 *                   type: string
 *               highlightAttractionSlugs:
 *                 description: Event-only highlight attraction slugs; see opportunity/common/constants/opportunity-highlight-attraction.ts. Stored on the event row; response also includes highlightAttractions { slug, label }.
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Opportunity event created
 *       400:
 *         description: Invalid request body
 *
 *   get:
 *     summary: Get all opportunity events
 *     description: Retrieve all opportunity events with their related lookups.
 *     responses:
 *       200:
 *         description: List of opportunity events
 */
router.post(
  "/events",
  validateBody(createOpportunityEventSchema),
  controller.create,
);
router.get("/events", controller.getAll);

/**
 * @swagger
 * /opportunity/events/{id}:
 *   get:
 *     summary: Get opportunity event by ID
 *     description: Retrieve a single opportunity event by its ID with all related data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Opportunity Event ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opportunity event retrieved successfully
 *       404:
 *         description: Opportunity event not found
 */
router.get("/events/:id", controller.getById);

export default router;
