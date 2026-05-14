import express from "express";
import { UserRepository } from "../users/users.repository.js";
import { ParentRepository } from "../parents/repository.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";
import { validateLoginBody } from "./auth.schema.js";

const router = express.Router();
const userRepository = new UserRepository();
const parentRepository = new ParentRepository();
const service = new AuthService(userRepository, parentRepository);
const controller = new AuthController(service);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates the user in Cognito and the local DB, then returns a token and user record.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: "{ token: string, user: { id, email, role, sub } }"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post("/register", validateLoginBody, controller.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: Authenticates with Cognito and returns a token. Send this token as Authorization Bearer on subsequent requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: "{ token: string, user: { id, email, role, sub, parrent:{} } }"
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", validateLoginBody, controller.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Returns the authenticated user. Requires Authorization Bearer token in the header.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ id, email, role, sub }"
 *       401:
 *         description: Missing or invalid token
 */
router.get("/me", requireAuth, controller.me);

export default router;
