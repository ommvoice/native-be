import { thirdPartySecrets } from './secrets';

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
    sharedTips:               () => required('TABLE_SHARED_TIPS'),
    venues:                   () => required('TABLE_VENUES'),
    events:                   () => required('TABLE_EVENTS'),
    clubs:                    () => required('TABLE_CLUBS'),
    routes:                   () => required('TABLE_ROUTES'),
  },

  // S3 uploads bucket — injected by CDK LambdaStack for lambdas with `env.uploads`
  uploadsBucket: () => required('UPLOADS_BUCKET'),
  awsRegion:     () => optional('AWS_REGION', 'eu-west-3'),

  // Auth
  cognitoUserPoolId: () => required('COGNITO_USER_POOL_ID'),
  cognitoClientId:   () => required('COGNITO_CLIENT_ID'),

  // External services — loaded from Secrets Manager (THIRD_PARTY_SECRET_ID) when deployed,
  // plain env vars locally. Async: see shared/config/secrets.ts.
  mapboxToken:      async () => (await thirdPartySecrets()).mapboxAccessToken,
  weatherApiKey:    async () => (await thirdPartySecrets()).weatherApiKey,
  googleMapsApiKey: async () => (await thirdPartySecrets()).googleMapsApiKey,

  appName: () => optional('APP_NAME', 'native-be'),
  appEnv:  () => optional('APP_ENV', 'dev'),
} as const;
