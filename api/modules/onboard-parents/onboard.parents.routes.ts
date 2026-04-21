import express from "express";
import { OnboardParentRepository } from "./onboard-parents.repository.js";
import { OnboardParentService } from "./onboard-parents.service.js";
import { OnboardParentController } from "./onboard-parents.controller.js";
import { UserRepository } from "../users/users.repository.js";
import { createOnboardParentSchema, validateBody } from "./schema.js";

const router = express.Router();
const onboardParentRepository = new OnboardParentRepository();
const userRepository= new UserRepository();
const service = new OnboardParentService(onboardParentRepository, userRepository);
const controller = new OnboardParentController(service);

/**
 * @swagger
 * /onboard-parents:
 *   post:
 *     summary: Create a new parent
 *     description: Creates a new parent and optionally one or more children.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: email address.
 *               firstNameOrNickName:
 *                 type: string
 *                 description: first name or nick n ame.
 *               postCode:
 *                 type: string
 *                 description: post code.
 *               password:
 *                 type: string
 *                 description: password.
 *               children:
 *                 type: array
 *                 description: Optional list of children belonging to this parent.
 *                 items:
 *                   type: object
 *                   properties:
 *                     nameOrNickName:
 *                       type: string
 *                       description: Child nameOrNickName
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       description: Child date of birth as ISO 8601 string.
 *     responses:
 *       201:
 *         description: Parent created successfully.
 *       400:
 *         description: Invalid input data.
 */
router.post("/", validateBody(createOnboardParentSchema), controller.create);

export default router;
