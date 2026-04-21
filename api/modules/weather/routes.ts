import express from "express";
import { WeatherService } from "./service.js";
import { WeatherController } from "./controller.js";
import { getCurrentQuerySchema, validateQuery } from "./schema.js";

const router = express.Router();
const service = new WeatherService();
const controller = new WeatherController(service);

/**
 * @swagger
 * /weather:
 *   get:
 *     summary: Current weather for a location
 *     description: Proxies WeatherAPI current conditions. Pass a location in `q` (city, lat/lon, postcode, etc.).
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Location query for WeatherAPI (e.g. London, 48.8567,2.3508)
 *     responses:
 *       200:
 *         description: Current weather JSON (WeatherAPI shape)
 *       400:
 *         description: Missing or invalid query
 *       502:
 *         description: Weather provider error
 */
router.get("/", validateQuery(getCurrentQuerySchema), controller.get);

export default router;
