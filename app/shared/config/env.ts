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
    interestCategories:       () => required('TABLE_INTEREST_CATEGORIES'),
    skills:                   () => required('TABLE_SKILLS'),
    skillLevels:              () => required('TABLE_SKILL_LEVELS'),
    facilities:               () => required('TABLE_FACILITIES'),
    opportunityVenues:        () => required('TABLE_OPPORTUNITY_VENUES'),
    opportunityEvents:        () => required('TABLE_OPPORTUNITY_EVENTS'),
    opportunityClubs:         () => required('TABLE_OPPORTUNITY_CLUBS'),
    opportunityRoutes:        () => required('TABLE_OPPORTUNITY_ROUTES'),
    drivingLegs:              () => required('TABLE_DRIVING_LEGS'),
    wishlists:                () => required('TABLE_WISHLISTS'),
    wishlistItems:            () => required('TABLE_WISHLIST_ITEMS'),
    opportunityClubsV2:       () => required('TABLE_OPPORTUNITY_CLUBS_V2'),
    opportunityEventsV2:      () => required('TABLE_OPPORTUNITY_EVENTS_V2'),
    opportunityVenuesV2:      () => required('TABLE_OPPORTUNITY_VENUES_V2'),
    opportunityRoutesV2:      () => required('TABLE_OPPORTUNITY_ROUTES_V2'),
    opportunityThemes:        () => required('TABLE_OPPORTUNITY_THEMES'),
    opportunityThemeVariants: () => required('TABLE_OPPORTUNITY_THEME_VARIANTS'),
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
