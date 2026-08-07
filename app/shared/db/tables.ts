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
  get drivingLegs()              { return env.tables.drivingLegs(); },
  get wishlists()                { return env.tables.wishlists(); },
  get wishlistItems()            { return env.tables.wishlistItems(); },
  get venues()                   { return env.tables.venues(); },
  get events()                   { return env.tables.events(); },
  get clubs()                    { return env.tables.clubs(); },
  get routes()                   { return env.tables.routes(); },
} as const;
