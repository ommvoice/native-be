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
 *       - Recommendations v2
 *     summary: Ranked v2 opportunities for parent + one child
 *     description: |
 *       Same scoring as `GET /recommendations-v2/{parentId}` but only the given child's ages and interests
 *       are combined with the parent's profile (equivalent to `GET /recommendations-v2/{parentId}?childId={childId}`).
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Scored recommendations (v2 opportunity payloads)
 */
router.get("/:parentId/children/:childId", controller.getForParentAndChild);

/**
 * @swagger
 * /recommendations-v2/{parentId}:
 *   get:
 *     tags:
 *       - Recommendations v2
 *     summary: Ranked v2 opportunities for a parent (theme + age + distance)
 *     description: |
 *       Uses `opportunity_*_v2` rows. Scores **theme + variant** overlap vs family interests (v2 FK slugs),
 *       **age suitability** from v2 age-suitability booleans, and **linear crow-fly distance** within the parent's
 *       `searchRadius` (miles); each contributes one third of `score`. Candidates outside the radius are excluded.
 *       `scoreBreakdown.skillScore` stays 0 until skills are wired.
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: childId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Scored recommendations (v2 opportunity payloads)
 */
router.get("/:parentId", controller.getForParent);

export default router;
