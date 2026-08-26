/** Single source of truth for every Lambda function.
 *  To add a new Lambda + endpoint: add one entry here. Nothing else needs to change.
 */

export interface RouteDefinition {
  /** Path segments from API root, e.g. ['parents', '{id}', 'interests'] */
  path:   string[];
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** true = RequestAuthorizer required, false = public */
  auth:   boolean;
}

export interface LambdaDefinition {
  /** Unique key used as the map key in LambdaStack and ApiStack. */
  key:   string;
  /** Function name suffix — full name becomes {appName}-{env}-{name}. */
  name:  string;
  /** Handler entry file, relative to app/lambdas/. */
  entry: string;

  /** Which extra env var groups to inject (tableEnv is always injected). */
  env?: {
    cognito?:     boolean;   // COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID
    externalApi?: boolean;   // MAPBOX_ACCESS_TOKEN, WEATHER_API_KEY
  };

  permissions: {
    dynamodb: 'none' | 'read' | 'readWrite';
    cognito:  boolean;   // AdminInitiateAuth / AdminCreateUser
  };

  overrides?: {
    memoryMb?:       number;
    timeoutSeconds?: number;
  };

  routes: RouteDefinition[];
}

// ── Auth ──────────────────────────────────────────────────────────────────────

const authLambdas: LambdaDefinition[] = [
  {
    key: 'authRegister', name: 'auth-register', entry: 'auth/register.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: true },
    routes: [{ path: ['auth', 'register'], method: 'POST', auth: false }],
  },
  {
    key: 'authLogin', name: 'auth-login', entry: 'auth/login.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: true },
    routes: [{ path: ['auth', 'login'], method: 'POST', auth: false }],
  },
  {
    key: 'authMe', name: 'auth-me', entry: 'auth/me.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: true },
    routes: [{ path: ['auth', 'me'], method: 'GET', auth: true }],
  },
  {
    key: 'authRefresh', name: 'auth-refresh', entry: 'auth/refresh.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'none', cognito: true },
    // Public: authenticates via the refresh token in the body, not the API's bearer-token authorizer.
    routes: [{ path: ['auth', 'refresh'], method: 'POST', auth: false }],
  },
];

// ── Users ─────────────────────────────────────────────────────────────────────

const usersLambdas: LambdaDefinition[] = [
  {
    key: 'usersGetMe', name: 'users-get-me', entry: 'users/get-me.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['users', 'me'], method: 'GET', auth: true }],
  },
];

// ── Onboard ───────────────────────────────────────────────────────────────────

const onboardLambdas: LambdaDefinition[] = [
  {
    key: 'onboardParents', name: 'onboard-parents', entry: 'onboard-parents/onboard.ts',
    env: { cognito: true, externalApi: true },
    permissions: { dynamodb: 'readWrite', cognito: true },
    overrides: { timeoutSeconds: 30 },
    routes: [{ path: ['onboard-parents'], method: 'POST', auth: false }],
  },
];

// ── Parents ───────────────────────────────────────────────────────────────────

const parentLambdas: LambdaDefinition[] = [
  {
    key: 'parentsGet', name: 'parents-get', entry: 'parents/get.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['parents', '{id}'], method: 'GET', auth: true }],
  },
  {
    key: 'parentsUpdateSearchRadius', name: 'parents-update-search-radius', entry: 'parents/update-search-radius.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    overrides: { timeoutSeconds: 30 },
    routes: [{ path: ['parents', '{id}', 'search-radius'], method: 'PUT', auth: true }],
  },
  {
    key: 'parentsUpdateInterests', name: 'parents-update-interests', entry: 'parents/update-interests.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['parents', '{id}', 'interests'], method: 'PUT', auth: true }],
  },
];

// ── Children ──────────────────────────────────────────────────────────────────

const childrenLambdas: LambdaDefinition[] = [
  {
    key: 'childrenCreate', name: 'children-create', entry: 'children/create.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['children'], method: 'POST', auth: true }],
  },
  {
    key: 'childrenGet', name: 'children-get', entry: 'children/get.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['children', '{id}'], method: 'GET', auth: true }],
  },
  {
    key: 'childrenUpdate', name: 'children-update', entry: 'children/update.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['children', '{id}'], method: 'PUT', auth: true }],
  },
  {
    key: 'childrenUpdateInterests', name: 'children-update-interests', entry: 'children/update-interests.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['children', '{id}', 'interests'], method: 'PUT', auth: true }],
  },
  {
    key: 'childrenUpdateInterestTags', name: 'children-update-interest-tags', entry: 'children/update-interest-tags.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['children', '{id}', 'interest-tags'], method: 'PUT', auth: true }],
  },
  {
    key: 'childrenDelete', name: 'children-delete', entry: 'children/delete.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['children', '{id}'], method: 'DELETE', auth: true }],
  },
];

// ── Interests ─────────────────────────────────────────────────────────────────

const interestsLambdas: LambdaDefinition[] = [
  {
    key: 'interestsListCategories', name: 'interests-list-categories', entry: 'interests/list-categories.ts',
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['interests', 'categories'], method: 'GET', auth: false }],
  },
  {
    key: 'interestsListSubCategories', name: 'interests-list-sub-categories', entry: 'interests/list-sub-categories.ts',
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['interests', 'sub-categories'], method: 'GET', auth: false }],
  },
  {
    key: 'interestsListTags', name: 'interests-tags-list', entry: 'interests/list-tags.ts',
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['interests', 'tags'], method: 'GET', auth: false }],
  },
];

// ── Skills ────────────────────────────────────────────────────────────────────

const skillsLambdas: LambdaDefinition[] = [
  {
    key: 'skillsList', name: 'skills-list', entry: 'skills/list.ts',
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['skills'], method: 'GET', auth: false }],
  },
];

// ── Themes ────────────────────────────────────────────────────────────────────

const themesLambdas: LambdaDefinition[] = [
  {
    key: 'themesList', name: 'themes-list', entry: 'themes/list.ts',
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['themes'], method: 'GET', auth: false }],
  },
  {
    key: 'themesListVariants', name: 'themes-list-variants', entry: 'themes/list-variants.ts',
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['themes', 'variants'], method: 'GET', auth: false }],
  },
];

// ── Facilities ────────────────────────────────────────────────────────────────

const facilitiesLambdas: LambdaDefinition[] = [
  {
    key: 'facilitiesList', name: 'facilities-list', entry: 'facilities/list.ts',
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['facilities'], method: 'GET', auth: false }],
  },
];

// ── Enums ─────────────────────────────────────────────────────────────────────

const enumsLambdas: LambdaDefinition[] = [
  {
    key: 'enumsList', name: 'enums-list', entry: 'enums/list.ts',
    permissions: { dynamodb: 'none', cognito: false },
    routes: [{ path: ['enums'], method: 'GET', auth: false }],
  },
];

// ── Opportunity V2 ────────────────────────────────────────────────────────────

const opportunityLambdas: LambdaDefinition[] = [
  {
    key: 'opportunityVenuesV2List', name: 'opportunity-venues-v2-list', entry: 'opportunity/venues-v2/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'venues'], method: 'GET', auth: false }],
  },
  {
    key: 'opportunityVenuesV2Get', name: 'opportunity-venues-v2-get', entry: 'opportunity/venues-v2/get.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'venues', '{id}'], method: 'GET', auth: false }],
  },
  {
    key: 'opportunityEventsV2List', name: 'opportunity-events-v2-list', entry: 'opportunity/events-v2/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'events'], method: 'GET', auth: false }],
  },
  {
    key: 'opportunityEventsV2Get', name: 'opportunity-events-v2-get', entry: 'opportunity/events-v2/get.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'events', '{id}'], method: 'GET', auth: false }],
  },
  {
    key: 'opportunityClubsV2List', name: 'opportunity-clubs-v2-list', entry: 'opportunity/clubs-v2/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'clubs'], method: 'GET', auth: false }],
  },
  {
    key: 'opportunityClubsV2Get', name: 'opportunity-clubs-v2-get', entry: 'opportunity/clubs-v2/get.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'clubs', '{id}'], method: 'GET', auth: false }],
  },
  {
    key: 'opportunityRoutesV2List', name: 'opportunity-routes-v2-list', entry: 'opportunity/routes-v2/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'routes'], method: 'GET', auth: false }],
  },
  {
    key: 'opportunityRoutesV2Get', name: 'opportunity-routes-v2-get', entry: 'opportunity/routes-v2/get.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'read', cognito: false },
    routes: [{ path: ['opportunity', 'routes', '{id}'], method: 'GET', auth: false }],
  },
];

// ── Recommendations V2 ────────────────────────────────────────────────────────

const recommendationsLambdas: LambdaDefinition[] = [
  {
    key: 'recommendationsV2Get', name: 'recommendations-v2-get', entry: 'recommendations-v2/get.ts',
    env: { cognito: true, externalApi: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    overrides: { timeoutSeconds: 60, memoryMb: 1024 },
    routes: [{ path: ['recommendations-v2'], method: 'GET', auth: true }],
  },
  {
    key: 'recommendationsV2Nearby', name: 'recommendations-v2-nearby', entry: 'recommendations-v2/nearby.ts',
    env: { cognito: true, externalApi: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    overrides: { timeoutSeconds: 60, memoryMb: 1024 },
    routes: [{ path: ['recommendations-v2', 'nearby'], method: 'GET', auth: true }],
  },
];

// ── Plan ──────────────────────────────────────────────────────────────────────

const planLambdas: LambdaDefinition[] = [
  {
    key: 'planFamily', name: 'plan-family', entry: 'plan/family.ts',
    env: { cognito: true, externalApi: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    overrides: { timeoutSeconds: 60, memoryMb: 1024 },
    routes: [{ path: ['plan', 'family'], method: 'GET', auth: true }],
  },
  {
    key: 'planAll', name: 'plan-all', entry: 'plan/all.ts',
    env: { cognito: true, externalApi: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    overrides: { timeoutSeconds: 60, memoryMb: 1024 },
    routes: [{ path: ['plan', 'all'], method: 'GET', auth: true }],
  },
];

// ── Wishlists ─────────────────────────────────────────────────────────────────

const wishlistsLambdas: LambdaDefinition[] = [
  {
    key: 'wishlistsList', name: 'wishlists-list', entry: 'wishlists/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['wishlists'], method: 'GET', auth: true }],
  },
  {
    key: 'wishlistsCreate', name: 'wishlists-create', entry: 'wishlists/create.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['wishlists'], method: 'POST', auth: true }],
  },
  {
    key: 'wishlistsDelete', name: 'wishlists-delete', entry: 'wishlists/delete.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['wishlists', '{id}'], method: 'DELETE', auth: true }],
  },
  {
    key: 'wishlistItemsList', name: 'wishlist-items-list', entry: 'wishlists/items/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['wishlists', '{id}', 'items'], method: 'GET', auth: true }],
  },
  {
    key: 'wishlistItemsAdd', name: 'wishlist-items-add', entry: 'wishlists/items/add.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['wishlists', '{id}', 'items'], method: 'POST', auth: true }],
  },
  {
    key: 'wishlistItemsRemove', name: 'wishlist-items-remove', entry: 'wishlists/items/remove.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['wishlists', '{id}', 'items', '{itemId}'], method: 'DELETE', auth: true }],
  },
];

// ── Visit intentions ("Remind Me") ─────────────────────────────────────────────

const visitIntentionsLambdas: LambdaDefinition[] = [
  {
    key: 'visitIntentionsList', name: 'visit-intentions-list', entry: 'visit-intentions/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['visit-intentions'], method: 'GET', auth: true }],
  },
  {
    key: 'visitIntentionsUpsert', name: 'visit-intentions-upsert', entry: 'visit-intentions/upsert.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['visit-intentions'], method: 'PUT', auth: true }],
  },
  {
    key: 'visitIntentionsRemove', name: 'visit-intentions-remove', entry: 'visit-intentions/remove.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['visit-intentions', '{id}'], method: 'DELETE', auth: true }],
  },
];

// ── Opportunity interactions (visited / not interested / star rating) ─────────

const opportunityInteractionsLambdas: LambdaDefinition[] = [
  {
    key: 'opportunityInteractionsList', name: 'opportunity-interactions-list', entry: 'opportunity-interactions/list.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['opportunity-interactions'], method: 'GET', auth: true }],
  },
  {
    key: 'opportunityInteractionsUpsert', name: 'opportunity-interactions-upsert', entry: 'opportunity-interactions/upsert.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['opportunity-interactions'], method: 'PUT', auth: true }],
  },
  {
    key: 'opportunityInteractionsRemove', name: 'opportunity-interactions-remove', entry: 'opportunity-interactions/remove.ts',
    env: { cognito: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    routes: [{ path: ['opportunity-interactions', '{id}'], method: 'DELETE', auth: true }],
  },
];

// ── Search ────────────────────────────────────────────────────────────────────

const searchLambdas: LambdaDefinition[] = [
  {
    key: 'searchOpportunities', name: 'search-opportunities', entry: 'search/search.ts',
    // getItemsWithScore's weather step calls weatherapi.com — needs WEATHER_API_KEY.
    env: { cognito: true, externalApi: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    overrides: { timeoutSeconds: 30 },
    routes: [{ path: ['search'], method: 'GET', auth: true }],
  },
  {
    key: 'searchList', name: 'search-list', entry: 'search/search-list.ts',
    // getSearchRecommendations -> getItemsWithScore's weather step calls weatherapi.com — needs
    // WEATHER_API_KEY.
    env: { cognito: true, externalApi: true },
    permissions: { dynamodb: 'readWrite', cognito: false },
    overrides: { timeoutSeconds: 30 },
    routes: [{ path: ['search', 'list'], method: 'GET', auth: true }],
  },
];

// ── Weather ───────────────────────────────────────────────────────────────────

const weatherLambdas: LambdaDefinition[] = [
  {
    key: 'weatherGet', name: 'weather-get', entry: 'weather/get.ts',
    env: { externalApi: true },
    permissions: { dynamodb: 'none', cognito: false },
    overrides: { timeoutSeconds: 15 },
    routes: [{ path: ['weather'], method: 'GET', auth: false }],
  },
];

// ── Mapbox ────────────────────────────────────────────────────────────────────

const mapboxLambdas: LambdaDefinition[] = [
  {
    key: 'mapboxDirections', name: 'mapbox-directions', entry: 'mapbox/directions.ts',
    env: { externalApi: true },
    permissions: { dynamodb: 'none', cognito: false },
    overrides: { timeoutSeconds: 15 },
    routes: [{ path: ['mapbox', 'directions'], method: 'POST', auth: true }],
  },
];

// ── All Lambdas ───────────────────────────────────────────────────────────────

export const allLambdas: LambdaDefinition[] = [
  ...authLambdas,
  ...usersLambdas,
  ...onboardLambdas,
  ...parentLambdas,
  ...childrenLambdas,
  ...interestsLambdas,
  ...skillsLambdas,
  ...themesLambdas,
  ...facilitiesLambdas,
  ...enumsLambdas,
  ...opportunityLambdas,
  ...recommendationsLambdas,
  ...planLambdas,
  ...wishlistsLambdas,
  ...visitIntentionsLambdas,
  ...opportunityInteractionsLambdas,
  ...searchLambdas,
  ...weatherLambdas,
  ...mapboxLambdas,
];
