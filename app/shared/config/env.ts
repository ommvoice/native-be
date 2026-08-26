/** Typed, validated access to Lambda environment variables. */

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // DynamoDB table names — injected by CDK LambdaStack
  tables: {
    users:                    () => required('TABLE_USERS'),
    parents:                  () => required('TABLE_PARENTS'),
    children:                 () => required('TABLE_CHILDREN'),
    drivingLegs:              () => required('TABLE_DRIVING_LEGS'),
    wishlists:                () => required('TABLE_WISHLISTS'),
    wishlistItems:            () => required('TABLE_WISHLIST_ITEMS'),
    visitIntentions:          () => required('TABLE_VISIT_INTENTIONS'),
    opportunityInteractions:  () => required('TABLE_OPPORTUNITY_INTERACTIONS'),
    venues:                   () => required('TABLE_VENUES'),
    events:                   () => required('TABLE_EVENTS'),
    clubs:                    () => required('TABLE_CLUBS'),
    routes:                   () => required('TABLE_ROUTES'),
  },

  // Auth
  cognitoUserPoolId: () => required('COGNITO_USER_POOL_ID'),
  cognitoClientId:   () => required('COGNITO_CLIENT_ID'),

  // External services
  mapboxToken:  () => optional('MAPBOX_ACCESS_TOKEN'),
  weatherApiKey:() => optional('WEATHER_API_KEY'),

  appName: () => optional('APP_NAME', 'native-be'),
  appEnv:  () => optional('APP_ENV', 'dev'),
} as const;
