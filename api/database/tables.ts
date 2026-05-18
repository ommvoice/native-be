const PREFIX = process.env.DYNAMODB_TABLE_PREFIX ?? "native-be";

export const TABLES = {
  users: `${PREFIX}-users`,
  parents: `${PREFIX}-parents`,
  children: `${PREFIX}-children`,
  interestCategories: `${PREFIX}-interest-categories`,
  interestSubCategories: `${PREFIX}-interest-sub-categories`,
  skills: `${PREFIX}-skills`,
  skillLevels: `${PREFIX}-skill-levels`,
  facilities: `${PREFIX}-facilities`,
  opportunityVenues: `${PREFIX}-opportunity-venues`,
  opportunityEvents: `${PREFIX}-opportunity-events`,
  opportunityClubs: `${PREFIX}-opportunity-clubs`,
  opportunityRoutes: `${PREFIX}-opportunity-routes`,
  drivingLegs: `${PREFIX}-driving-legs`,
  wishlists: `${PREFIX}-wishlists`,
  wishlistItems: `${PREFIX}-wishlist-items`,
} as const;
