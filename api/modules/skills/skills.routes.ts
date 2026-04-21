import express from "express";
import { SkillRepository } from "./skills.repository.js";
import { SkillService } from "./skills.service.js";
import { SkillController } from "./skills.controller.js";

const router = express.Router();
const repository = new SkillRepository();
const service = new SkillService(repository);
const controller = new SkillController(service);

/**
 * @swagger
 * /skills:
 *   get:
 *     summary: Get all skill groups
 *     description: Retrieve all skill groups (interest-based and age-based) with their skills.
 *     responses:
 *       200:
 *         description: Skill groups retrieved successfully
 */
router.get("/", controller.getAll);

/**
 * @swagger
 * /skills/interest-based:
 *   get:
 *     summary: Get interest-based skills (grouped by subcategory)
 *     description: One object per root interest subcategory; each lists INTEREST_BASED skills with category context.
 *     responses:
 *       200:
 *         description: Interest-based skill groups retrieved successfully
 */
router.get("/interest-based", controller.getInterestBased);

/**
 * @swagger
 * /skills/age-based:
 *   get:
 *     summary: Get age-based skill groups
 *     description: Retrieve age-based skill groups with their skills (ordered by label). Per-skill ages use Skill.minAge / Skill.maxAge when set.
 *     responses:
 *       200:
 *         description: Age-based skill groups retrieved successfully
 */
router.get("/age-based", controller.getAgeBased);

/**
 * @swagger
 * /skills/levels:
 *   get:
 *     summary: Get skill levels
 *     description: Retrieve all skill levels ordered by id (0-4).
 *     responses:
 *       200:
 *         description: Skill levels retrieved successfully
 */
router.get("/levels", controller.getLevels);

export default router;
