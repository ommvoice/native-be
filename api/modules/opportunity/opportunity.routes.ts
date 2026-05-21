import express from "express";
import opportunityAllRoutes from "./all/routes.js";
import opportunityEventsRoutes from "./events/routes.js";
import opportunityClubsRoutes from "./clubs/routes.js";
import opportunityRoutesRoutes from "./routes/routes.js";
import opportunityVenuesRoutes from "./venues/routes.js";
import opportunityClubsV2Routes from "./clubs_v2/routes.js";
import opportunityEventsV2Routes from "./events_v2/routes.js";
import opportunityRoutesV2Routes from "./routes_v2/routes.js";
import opportunityVenuesV2Routes from "./venues_v2/routes.js";

const router = express.Router();

router.use(opportunityAllRoutes);
router.use(opportunityEventsRoutes);
router.use(opportunityClubsRoutes);
router.use(opportunityRoutesRoutes);
router.use(opportunityVenuesRoutes);
router.use(opportunityClubsV2Routes);
router.use(opportunityEventsV2Routes);
router.use(opportunityRoutesV2Routes);
router.use(opportunityVenuesV2Routes);

export default router;
