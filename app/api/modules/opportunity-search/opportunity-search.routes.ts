import { Router } from "express";
import asyncHandler from "../../shared/utils/asyncHandler.js";
import { OpportunitySearchController } from "./controller.js";
import {
  opportunitySearchQuerySchema,
  validateOpportunitySearchQuery,
} from "./schema.js";
import { OpportunitySearchRepository } from "./repository.js";
import { OpportunitySearchService } from "./service.js";
import { RecommendationsRepository } from "../recommendations/repository.js";

const router = Router();
const searchRepo = new OpportunitySearchRepository();
const enrichRepo = new RecommendationsRepository();
const service = new OpportunitySearchService(searchRepo, enrichRepo);
const controller = new OpportunitySearchController(service);

/**
 * @swagger
 * /search/opportunities:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search opportunities by interest subcategory and cached driving limits
 *     description: |
 *       Uses `parent_opportunity_driving_legs` for this parent. Optional `maxTimeToReachMinutes` and
 *       `maxDistanceMiles` filter legs by driving duration and distance; omit either to skip that cap.
 *       Optional `interestSubCategorySlug` filters by opportunity `interestTags` / `themeSlug`; omit to return all legs that pass time/distance.
 *       Optional `facility` is one or more `facilities.slug` values, comma-separated; the opportunity must list
 *       **at least one** of them on `generalFacilitySlugs`, `kidsFacilitySlugs`, `parentFacilitySlugs`, or
 *       (routes / venues) `dogFacilitySlugs`.
 *       `distanceMiles` is great-circle distance between coordinates on the driving leg snapshot.
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: interestSubCategorySlug
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxTimeToReachMinutes
 *         required: false
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDistanceMiles
 *         required: false
 *         schema:
 *           type: number
 *       - in: query
 *         name: childId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: If set, child must belong to the parent; `interestSubCategorySlug` is then required and must be on the child profile.
 *       - in: query
 *         name: facility
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated facility slugs from `GET /facilities` (e.g. `wifi` or `wifi,dog_bins`). Match is OR.
 *     responses:
 *       200:
 *         description: Matching opportunities with driving metrics
 */
router.get(
  "/opportunities",
  validateOpportunitySearchQuery(opportunitySearchQuerySchema),
  asyncHandler(controller.search),
);

export default router;
