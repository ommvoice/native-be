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

  readonly lambdaNames: {
    authRegister: string;
    authLogin: string;
    authMe: string;
    usersGetMe: string;
    parentsGet: string;
    parentsUpdateSearchRadius: string;
    parentsUpdateInterests: string;
    onboardParents: string;
    childrenCreate: string;
    childrenGet: string;
    childrenUpdate: string;
    childrenUpdateInterests: string;
    interestsListCategories: string;
    interestsListSubCategories: string;
    skillsList: string;
    themesList: string;
    themesListVariants: string;
    facilitiesList: string;
    opportunityVenuesV2List: string;
    opportunityVenuesV2Get: string;
    opportunityEventsV2List: string;
    opportunityEventsV2Get: string;
    opportunityClubsV2List: string;
    opportunityClubsV2Get: string;
    opportunityRoutesV2List: string;
    opportunityRoutesV2Get: string;
    recommendationsV2Get: string;
    recommendationsV2Nearby: string;
    wishlistsList: string;
    wishlistsCreate: string;
    searchOpportunities: string;
    weatherGet: string;
  };

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

    const l = (name: string) => `${opts.appName}-${opts.env}-${name}`;

    this.lambdaNames = {
      authRegister:                 l('auth-register'),
      authLogin:                    l('auth-login'),
      authMe:                       l('auth-me'),
      usersGetMe:                   l('users-get-me'),
      parentsGet:                   l('parents-get'),
      parentsUpdateSearchRadius:    l('parents-update-search-radius'),
      parentsUpdateInterests:       l('parents-update-interests'),
      onboardParents:               l('onboard-parents'),
      childrenCreate:               l('children-create'),
      childrenGet:                  l('children-get'),
      childrenUpdate:               l('children-update'),
      childrenUpdateInterests:      l('children-update-interests'),
      interestsListCategories:      l('interests-list-categories'),
      interestsListSubCategories:   l('interests-list-sub-categories'),
      skillsList:                   l('skills-list'),
      themesList:                   l('themes-list'),
      themesListVariants:           l('themes-list-variants'),
      facilitiesList:               l('facilities-list'),
      opportunityVenuesV2List:      l('opportunity-venues-v2-list'),
      opportunityVenuesV2Get:       l('opportunity-venues-v2-get'),
      opportunityEventsV2List:      l('opportunity-events-v2-list'),
      opportunityEventsV2Get:       l('opportunity-events-v2-get'),
      opportunityClubsV2List:       l('opportunity-clubs-v2-list'),
      opportunityClubsV2Get:        l('opportunity-clubs-v2-get'),
      opportunityRoutesV2List:      l('opportunity-routes-v2-list'),
      opportunityRoutesV2Get:       l('opportunity-routes-v2-get'),
      recommendationsV2Get:         l('recommendations-v2-get'),
      recommendationsV2Nearby:      l('recommendations-v2-nearby'),
      wishlistsList:                l('wishlists-list'),
      wishlistsCreate:              l('wishlists-create'),
      searchOpportunities:          l('search-opportunities'),
      weatherGet:                   l('weather-get'),
    };
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
