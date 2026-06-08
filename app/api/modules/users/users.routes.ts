import express from "express";
import { UserRepository } from "./users.repository.js";
import { UserService } from "./users.service.js";
import { UserController } from "./users.controller.js";
import { getByEmailSchema, validateQuery } from "./schema.js";

const router = express.Router();
const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves details of a specific user by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve.
 *     responses:
 *       200:
 *         description: User details.
 *       404:
 *         description: user not found.
 */
router.get("/:id", controller.getById);

/**
 * @swagger
 * /users/{email}:
 *   get:
 *     summary: Get user by email
 *     description: Retrieves details of a specific user by its email.
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to retrieve.
 *     responses:
 *       200:
 *         description: User details.
 *       404:
 *         description: User not found.
 */
router.get("/", validateQuery(getByEmailSchema), controller.getByEmail);

export default router;
