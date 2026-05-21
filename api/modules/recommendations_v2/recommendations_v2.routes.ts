import { Router } from "express";
import { RecommendationsV2Controller } from "./controller.js";
import { RecommendationsV2Repository } from "./repository.js";
import { RecommendationsV2Service } from "./service.js";

const router = Router();
const repository = new RecommendationsV2Repository();
const service = new RecommendationsV2Service(repository);
const controller = new RecommendationsV2Controller(service);

/**
 * @swagger
 * /recommendations-v2/{parentId}/children/{childId}:
 *   get:
 *     tags:
 *       - Recommendations V2
 *     summary: Ranked v2 opportunity recommendations for a parent + one child
 *     description: |
 *       Scores all v2 opportunity records (venues, events, clubs, routes) against the parent's
 *       location and the given child's profile. Equivalent to
 *       `GET /recommendations-v2/{parentId}?childId={childId}`.
 *
 *       **Scoring:** `theme` overlap (v2 slugs) + boolean age-band match + linear crow-fly
 *       distance — each contributes one third. Any zero component excludes the candidate.
 *       Candidates outside the parent's `searchRadius` are excluded.
 *
 *       **Driving distance:** When `MAPBOX_ACCESS_TOKEN` is set, Mapbox Matrix driving
 *       distances are cached per parent and included in the response.
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent DynamoDB ID
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Child DynamoDB ID
 *     responses:
 *       200:
 *         description: Scored v2 recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 scope:
 *                   type: string
 *                   example: parent_and_child
 *                 childId:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnrichedScoredRecommendationV2'
 *       400:
 *         description: Missing / invalid parent location or no children
 *       404:
 *         description: Parent not found
 */
router.get("/:parentId/children/:childId", controller.getForParentAndChild);

/**
 * @swagger
 * /recommendations-v2/{parentId}:
 *   get:
 *     tags:
 *       - Recommendations V2
 *     summary: Ranked v2 opportunity recommendations for a parent (all children)
 *     description: |
 *       Combines the parent's interests with all registered children's interests, ages, and skills
 *       to score every v2 opportunity. Pass `childId` query param to scope to one child only.
 *
 *       Returns at most 30 results ordered by descending `score`.
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent DynamoDB ID
 *       - in: query
 *         name: childId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Scope results to a single child (parent interests still apply)
 *     responses:
 *       200:
 *         description: Scored v2 recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnrichedScoredRecommendationV2'
 *       400:
 *         description: Missing / invalid parent location or no children
 *       404:
 *         description: Parent not found
 */
router.get("/:parentId", controller.getForParent);

export default router;
