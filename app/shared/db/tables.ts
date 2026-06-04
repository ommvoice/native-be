import { env } from '../config/env';

/**
 * Resolved DynamoDB table names read from Lambda environment variables.
 * Values are resolved lazily so the module can be imported without env vars
 * being set at module-load time (e.g. in unit tests).
 */
export const TABLES = {
  get users()                    { return env.tables.users(); },
  get parents()                  { return env.tables.parents(); },
  get children()                 { return env.tables.children(); },
  get interestCategories()       { return env.tables.interestCategories(); },
  get skills()                   { return env.tables.skills(); },
  get skillLevels()              { return env.tables.skillLevels(); },
  get facilities()               { return env.tables.facilities(); },
  get opportunityVenues()        { return env.tables.opportunityVenues(); },
  get opportunityEvents()        { return env.tables.opportunityEvents(); },
  get opportunityClubs()         { return env.tables.opportunityClubs(); },
  get opportunityRoutes()        { return env.tables.opportunityRoutes(); },
  get drivingLegs()              { return env.tables.drivingLegs(); },
  get wishlists()                { return env.tables.wishlists(); },
  get wishlistItems()            { return env.tables.wishlistItems(); },
  get opportunityClubsV2()       { return env.tables.opportunityClubsV2(); },
  get opportunityEventsV2()      { return env.tables.opportunityEventsV2(); },
  get opportunityVenuesV2()      { return env.tables.opportunityVenuesV2(); },
  get opportunityRoutesV2()      { return env.tables.opportunityRoutesV2(); },
  get opportunityThemes()        { return env.tables.opportunityThemes(); },
  get opportunityThemeVariants() { return env.tables.opportunityThemeVariants(); },
} as const;
