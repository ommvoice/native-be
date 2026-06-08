import { Router } from "express";
import { RecommendationsController } from "./controller.js";
import { RecommendationsRepository } from "./repository.js";
import { RecommendationsService } from "./service.js";

const router = Router();
const repository = new RecommendationsRepository();
const service = new RecommendationsService(repository);
const controller = new RecommendationsController(service);

/**
 * @swagger
 * /recommendations/{parentId}/nearby:
 *   get:
 *     tags:
 *       - Recommendations
 *     summary: Nearby-style ranked opportunities (age + distance only)
 *     description: |
 *       Same candidate pool and parent's profile search radius (**miles**) as the main recommendations endpoint, but **ignores interests**.
 *       Total score is 50% age suitability + 50% distance; `scoreBreakdown.interestScore` and `skillScore` are always 0.
 *       Only opportunities with **latitude** and **longitude** on the row are included (no postcode geocoding).
 *       Mapbox driving cache (`MAPBOX_ACCESS_TOKEN`) applies the same way as the main recommendations endpoint.
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
 *         description: Scored nearby recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 mode:
 *                   type: string
 *                   example: nearby
 *                 data:
 *                   type: array
 *                   description: >
 *                     Each item is the same JSON shape as the matching opportunity getById
 *                     (`GET /opportunities/venues/:id`, `/events/:id`, `/clubs/:id`, or `/routes/:id`),
 *                     plus `distanceMiles`, `drivingDistanceMiles`, `drivingDurationSeconds`,
 *                     `score`, and `scoreBreakdown` (including `interestScore`, `skillScore`, `ageScore`, `distanceScore`).
 *                   items:
 *                     type: object
 */
router.get("/:parentId/nearby", controller.getNearbyForParent);

/**
 * @swagger
 * /recommendations/{parentId}/family:
 *   get:
 *     tags:
 *       - Recommendations
 *     summary: Ranked opportunities for parent + all children
 *     description: |
 *       Same scoring weights and candidate pool as `GET /recommendations/{parentId}` when no `childId` is passed:
 *       parent interests combined with **every** child's interests; skills and ages consider **all** children.
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Scored recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 scope:
 *                   type: string
 *                   example: family
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/:parentId/family", controller.getForFamily);

/**
 * @swagger
 * /recommendations/{parentId}/children/{childId}:
 *   get:
 *     tags:
 *       - Recommendations
 *     summary: Ranked opportunities for parent + one child
 *     description: |
 *       Same scoring weights as the main recommendations endpoint; only the given child's ages, interests, and skills
 *       are combined with the parent's profile (equivalent to `GET /recommendations/{parentId}?childId={childId}`).
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
 *         description: Scored recommendations
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
 *                   format: uuid
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/:parentId/children/:childId", controller.getForParentAndChild);

/**
 * @swagger
 * /recommendations/{parentId}:
 *   get:
 *     tags:
 *       - Recommendations
 *     summary: Ranked opportunities for a parent (and optional single child filter)
 *     description: |
 *       Scores venues, events, clubs, and routes using parent latitude/longitude from the profile,
 *       weighted 25% interests, 25% children's skills (vs event/club `skillAreaSlug` / `skillAreaVariant`), 25% age suitability, 25% distance within the parent's profile `searchRadius` (**miles**).
 *       Each opportunity must have `latitude` and `longitude` on its row for distance scoring.
 *       When `MAPBOX_ACCESS_TOKEN` is set, driving legs are read from `parent_opportunity_driving_legs` and missing pairs are filled via Mapbox Matrix/Directions; each item may include `drivingDistanceMiles` and `drivingDurationSeconds`.
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
 *         description: Scored recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   description: >
 *                     Each item matches the corresponding opportunity getById response
 *                     (venue, event, club, or route) plus recommendation fields
 *                     `distanceMiles`, `drivingDistanceMiles`, `drivingDurationSeconds`,
 *                     `score`, and `scoreBreakdown` (including `interestScore`, `skillScore`, `ageScore`, `distanceScore`).
 *                   items:
 *                     type: object
 */
router.get("/:parentId", controller.getForParent);

export default router;
