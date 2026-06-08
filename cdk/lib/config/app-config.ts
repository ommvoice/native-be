import { TABLE_SUFFIXES } from './table-suffixes';

export interface AppConfigOptions {
  appName: string;
  env: string;
  mapboxAccessToken: string;
  weatherApiKey: string;
  awsAccount?: string;
  awsRegion?: string;
  hostedZoneId: string;
  domain: string;
  certificateArn: string;
}

/** All resource names are derived from appName + env — nothing is hardcoded inline. */
export class AppConfig {
  readonly appName: string;
  readonly env: string;
  readonly mapboxAccessToken: string;
  readonly weatherApiKey: string;
  readonly awsAccount: string | undefined;
  readonly awsRegion: string | undefined;
  readonly hostedZoneId: string;
  readonly domain: string;
  readonly certificateArn: string;

  readonly tableNames: { [K in keyof typeof TABLE_SUFFIXES]: string };


  constructor(opts: AppConfigOptions) {
    this.appName           = opts.appName;
    this.env               = opts.env;
    this.mapboxAccessToken = opts.mapboxAccessToken;
    this.weatherApiKey     = opts.weatherApiKey;
    this.awsAccount        = opts.awsAccount;
    this.awsRegion         = opts.awsRegion;
    this.hostedZoneId      = opts.hostedZoneId;
    this.domain            = opts.domain;
    this.certificateArn    = opts.certificateArn;

    const t = (suffix: string) => `${opts.appName}-${opts.env}-${suffix}`;

    this.tableNames = Object.fromEntries(
      Object.entries(TABLE_SUFFIXES).map(([key, suffix]) => [key, t(suffix)]),
    ) as { [K in keyof typeof TABLE_SUFFIXES]: string };

  }

  prefix(name: string): string {
    return `${this.appName}-${this.env}-${name}`;
  }

  get layerName(): string       { return this.prefix('shared-layer'); }
  get apiName(): string         { return this.prefix('api'); }
  get apiStageName(): string    { return this.env; }

  get logRetentionDays(): number {
    return this.env === 'prod' ? 30 : 7;
  }

  get cognitoNames() {
    return {
      userPool:       this.prefix('user-pool'),
      userPoolClient: this.prefix('user-pool-client'),
    };
  }

  get stackNames() {
    return {
      cognito: this.prefix('cognito-stack'),
      tables:  this.prefix('table-stack'),
      lambdas: this.prefix('lambda-stack'),
      api:     this.prefix('api-stack'),
    };
  }
}

/** Env-var names injected into every Lambda by the Lambda stack. */
export const TABLE_ENV_VARS = {
  users:                    'TABLE_USERS',
  parents:                  'TABLE_PARENTS',
  children:                 'TABLE_CHILDREN',
  interestCategories:       'TABLE_INTEREST_CATEGORIES',
  skills:                   'TABLE_SKILLS',
  skillLevels:              'TABLE_SKILL_LEVELS',
  facilities:               'TABLE_FACILITIES',
  opportunityVenues:        'TABLE_OPPORTUNITY_VENUES',
  opportunityEvents:        'TABLE_OPPORTUNITY_EVENTS',
  opportunityClubs:         'TABLE_OPPORTUNITY_CLUBS',
  opportunityRoutes:        'TABLE_OPPORTUNITY_ROUTES',
  drivingLegs:              'TABLE_DRIVING_LEGS',
  wishlists:                'TABLE_WISHLISTS',
  wishlistItems:            'TABLE_WISHLIST_ITEMS',
  opportunityClubsV2:       'TABLE_OPPORTUNITY_CLUBS_V2',
  opportunityEventsV2:      'TABLE_OPPORTUNITY_EVENTS_V2',
  opportunityVenuesV2:      'TABLE_OPPORTUNITY_VENUES_V2',
  opportunityRoutesV2:      'TABLE_OPPORTUNITY_ROUTES_V2',
  opportunityThemes:        'TABLE_OPPORTUNITY_THEMES',
  opportunityThemeVariants: 'TABLE_OPPORTUNITY_THEME_VARIANTS',
} as const;
