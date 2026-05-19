import { Router } from "express";
import childrenRoutes from "../modules/children/routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import parentsRoutes from "../modules/parents/routes.js";
import onboardParentsRoutes from "../modules/onboard-parents/onboard.parents.routes.js";
import recommendationsRoutes from "../modules/recommendations/recommendations.routes.js";
import recommendationsV2Routes from "../modules/recommendations_v2/recommendations_v2.routes.js";
import skillsRoutes from "../modules/skills/skills.routes.js";
import interestsRoutes from "../modules/interests/routes.js";
import opportunityRoutes from "../modules/opportunity/opportunity.routes.js";
import wishlistsRoutes from "../modules/wishlists/wishlists.routes.js";
import weatherRoutes from "../modules/weather/routes.js";
import opportunitySearchRoutes from "../modules/opportunity-search/opportunity-search.routes.js";
import facilitiesRoutes from "../modules/facilities/routes.js";

export const configureRoutes = (io?: any) => {
  const router = Router();
  router.use("/children", childrenRoutes);
  router.use("/onboard-parents", onboardParentsRoutes);
  router.use("/parents", parentsRoutes);
  router.use("/users", usersRoutes);
  router.use("/recommendations", recommendationsRoutes);
  router.use("/recommendations-v2", recommendationsV2Routes);
  router.use("/skills", skillsRoutes);
  router.use("/interests", interestsRoutes);
  router.use("/opportunity", opportunityRoutes);
  router.use("/wishlists", wishlistsRoutes);
  router.use("/weather", weatherRoutes);
  router.use("/search", opportunitySearchRoutes);
  router.use("/facilities", facilitiesRoutes);

  return router;
};
