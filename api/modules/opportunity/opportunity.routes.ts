import express from "express";
import opportunityAllRoutes from "./all/routes.js";
import opportunityEventsRoutes from "./events/routes.js";
import opportunityClubsRoutes from "./clubs/routes.js";
import opportunityRoutesRoutes from "./routes/routes.js";
import opportunityVenuesRoutes from "./venues/routes.js";

const router = express.Router();

router.use(opportunityAllRoutes);
router.use(opportunityEventsRoutes);
router.use(opportunityClubsRoutes);
router.use(opportunityRoutesRoutes);
router.use(opportunityVenuesRoutes);

export default router;
