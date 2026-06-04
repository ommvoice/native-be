import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import { AppConfig, TABLE_ENV_VARS } from '../config/app-config';
import {
  LAMBDA_RUNTIME,
  LAYER_BUNDLING,
  LAMBDA_OVERRIDES,
  DYNAMODB_READ_WRITE_LAMBDAS,
  DYNAMODB_READ_ONLY_LAMBDAS,
  COGNITO_ADMIN_LAMBDAS,
  logRetentionDays,
} from '../config/lambda-config';
import { ApiLambda } from '../constructs/api-lambda.construct';
import type { CognitoStack } from './cognito-stack';

export interface LambdaStackProps extends cdk.StackProps {
  config: AppConfig;
  tables: Record<string, dynamodb.Table>;
  /** CognitoStack — User Pool ID + Client ID injected as env vars. */
  cognito: CognitoStack;
}

export class LambdaStack extends cdk.Stack {
  readonly lambdas: Record<string, lambdaNode.NodejsFunction>;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { config, tables, cognito } = props;

    // ── Lambda Layer ──────────────────────────────────────────────────────────

    const layer = new lambda.LayerVersion(this, 'SharedLayer', {
      layerVersionName: config.layerName,
      description:      `${config.appName} ${config.env} — shared npm dependencies`,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../..', 'layers'),
        { bundling: LAYER_BUNDLING },
      ),
      compatibleRuntimes:      [LAMBDA_RUNTIME],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
    });

    // ── Shared environment vars ───────────────────────────────────────────────

    const tableEnv: Record<string, string> = {
      [TABLE_ENV_VARS.users]:                    tables['users']!.tableName,
      [TABLE_ENV_VARS.parents]:                  tables['parents']!.tableName,
      [TABLE_ENV_VARS.children]:                 tables['children']!.tableName,
      [TABLE_ENV_VARS.interestCategories]:       tables['interestCategories']!.tableName,
      [TABLE_ENV_VARS.skills]:                   tables['skills']!.tableName,
      [TABLE_ENV_VARS.skillLevels]:              tables['skillLevels']!.tableName,
      [TABLE_ENV_VARS.facilities]:               tables['facilities']!.tableName,
      [TABLE_ENV_VARS.opportunityVenues]:        tables['opportunityVenues']!.tableName,
      [TABLE_ENV_VARS.opportunityEvents]:        tables['opportunityEvents']!.tableName,
      [TABLE_ENV_VARS.opportunityClubs]:         tables['opportunityClubs']!.tableName,
      [TABLE_ENV_VARS.opportunityRoutes]:        tables['opportunityRoutes']!.tableName,
      [TABLE_ENV_VARS.drivingLegs]:              tables['drivingLegs']!.tableName,
      [TABLE_ENV_VARS.wishlists]:                tables['wishlists']!.tableName,
      [TABLE_ENV_VARS.wishlistItems]:            tables['wishlistItems']!.tableName,
      [TABLE_ENV_VARS.opportunityClubsV2]:       tables['opportunityClubsV2']!.tableName,
      [TABLE_ENV_VARS.opportunityEventsV2]:      tables['opportunityEventsV2']!.tableName,
      [TABLE_ENV_VARS.opportunityVenuesV2]:      tables['opportunityVenuesV2']!.tableName,
      [TABLE_ENV_VARS.opportunityRoutesV2]:      tables['opportunityRoutesV2']!.tableName,
      [TABLE_ENV_VARS.opportunityThemes]:        tables['opportunityThemes']!.tableName,
      [TABLE_ENV_VARS.opportunityThemeVariants]: tables['opportunityThemeVariants']!.tableName,
      APP_NAME: config.appName,
      APP_ENV:  config.env,
    };

    const cognitoEnv = {
      COGNITO_USER_POOL_ID: cognito.outputs.userPoolId,
      COGNITO_CLIENT_ID:    cognito.outputs.userPoolClientId,
    };

    const externalApiEnv = {
      MAPBOX_ACCESS_TOKEN: config.mapboxAccessToken,
      WEATHER_API_KEY:     config.weatherApiKey,
    };

    const lambdasDir = path.join(__dirname, '../../..', 'app', 'lambdas');
    const retention  = logRetentionDays(config.env);

    // ── Helper ────────────────────────────────────────────────────────────────

    const fns: Record<string, lambdaNode.NodejsFunction> = {};

    const register = (
      key: string,
      functionName: string,
      relPath: string,
      extraEnv: Record<string, string> = {},
    ): lambdaNode.NodejsFunction => {
      const override = LAMBDA_OVERRIDES[key] ?? {};
      const construct = new ApiLambda(this, `Lambda_${key}`, {
        functionName,
        entry:            path.join(lambdasDir, relPath),
        logRetentionDays: retention,
        layer,
        environment:      { ...tableEnv, ...extraEnv },
        memoryMb:         override.memoryMb,
        timeoutSeconds:   override.timeoutSeconds,
        appEnv:           config.env,
      });
      fns[key] = construct.fn;
      return construct.fn;
    };

    // ── Auth ──────────────────────────────────────────────────────────────────
    register('authRegister', config.lambdaNames.authRegister, 'auth/register.ts', cognitoEnv);
    register('authLogin',    config.lambdaNames.authLogin,    'auth/login.ts',    cognitoEnv);
    register('authMe',       config.lambdaNames.authMe,       'auth/me.ts',       cognitoEnv);

    // ── Users ─────────────────────────────────────────────────────────────────
    register('usersGetMe', config.lambdaNames.usersGetMe, 'users/get-me.ts', cognitoEnv);

    // ── Parents ───────────────────────────────────────────────────────────────
    register('parentsGet',                config.lambdaNames.parentsGet,                'parents/get.ts',                  cognitoEnv);
    register('parentsUpdateSearchRadius', config.lambdaNames.parentsUpdateSearchRadius, 'parents/update-search-radius.ts', cognitoEnv);
    register('parentsUpdateInterests',    config.lambdaNames.parentsUpdateInterests,    'parents/update-interests.ts',     cognitoEnv);

    // ── Onboard ───────────────────────────────────────────────────────────────
    register('onboardParents', config.lambdaNames.onboardParents, 'onboard-parents/onboard.ts', { ...cognitoEnv, ...externalApiEnv });

    // ── Children ──────────────────────────────────────────────────────────────
    register('childrenCreate',          config.lambdaNames.childrenCreate,          'children/create.ts',           cognitoEnv);
    register('childrenGet',             config.lambdaNames.childrenGet,             'children/get.ts',              cognitoEnv);
    register('childrenUpdate',          config.lambdaNames.childrenUpdate,          'children/update.ts',           cognitoEnv);
    register('childrenUpdateInterests', config.lambdaNames.childrenUpdateInterests, 'children/update-interests.ts', cognitoEnv);

    // ── Interests ─────────────────────────────────────────────────────────────
    register('interestsListCategories',    config.lambdaNames.interestsListCategories,    'interests/list-categories.ts');
    register('interestsListSubCategories', config.lambdaNames.interestsListSubCategories, 'interests/list-sub-categories.ts');

    // ── Skills ────────────────────────────────────────────────────────────────
    register('skillsList', config.lambdaNames.skillsList, 'skills/list.ts');

    // ── Themes ────────────────────────────────────────────────────────────────
    register('themesList',         config.lambdaNames.themesList,         'themes/list.ts');
    register('themesListVariants', config.lambdaNames.themesListVariants, 'themes/list-variants.ts');

    // ── Facilities ────────────────────────────────────────────────────────────
    register('facilitiesList', config.lambdaNames.facilitiesList, 'facilities/list.ts');

    // ── Opportunity V2 ────────────────────────────────────────────────────────
    register('opportunityVenuesV2List', config.lambdaNames.opportunityVenuesV2List, 'opportunity/venues-v2/list.ts',  cognitoEnv);
    register('opportunityVenuesV2Get',  config.lambdaNames.opportunityVenuesV2Get,  'opportunity/venues-v2/get.ts',   cognitoEnv);
    register('opportunityEventsV2List', config.lambdaNames.opportunityEventsV2List, 'opportunity/events-v2/list.ts',  cognitoEnv);
    register('opportunityEventsV2Get',  config.lambdaNames.opportunityEventsV2Get,  'opportunity/events-v2/get.ts',   cognitoEnv);
    register('opportunityClubsV2List',  config.lambdaNames.opportunityClubsV2List,  'opportunity/clubs-v2/list.ts',   cognitoEnv);
    register('opportunityClubsV2Get',   config.lambdaNames.opportunityClubsV2Get,   'opportunity/clubs-v2/get.ts',    cognitoEnv);
    register('opportunityRoutesV2List', config.lambdaNames.opportunityRoutesV2List, 'opportunity/routes-v2/list.ts',  cognitoEnv);
    register('opportunityRoutesV2Get',  config.lambdaNames.opportunityRoutesV2Get,  'opportunity/routes-v2/get.ts',   cognitoEnv);

    // ── Recommendations V2 ────────────────────────────────────────────────────
    register('recommendationsV2Get',    config.lambdaNames.recommendationsV2Get,    'recommendations-v2/get.ts',    { ...cognitoEnv, ...externalApiEnv });
    register('recommendationsV2Nearby', config.lambdaNames.recommendationsV2Nearby, 'recommendations-v2/nearby.ts', { ...cognitoEnv, ...externalApiEnv });

    // ── Wishlists ─────────────────────────────────────────────────────────────
    register('wishlistsList',   config.lambdaNames.wishlistsList,   'wishlists/list.ts',   cognitoEnv);
    register('wishlistsCreate', config.lambdaNames.wishlistsCreate, 'wishlists/create.ts', cognitoEnv);

    // ── Search ────────────────────────────────────────────────────────────────
    register('searchOpportunities', config.lambdaNames.searchOpportunities, 'search/search.ts', cognitoEnv);

    // ── Weather ───────────────────────────────────────────────────────────────
    register('weatherGet', config.lambdaNames.weatherGet, 'weather/get.ts', externalApiEnv);

    // ── DynamoDB permissions ──────────────────────────────────────────────────

    const allTables = Object.values(tables);
    for (const key of DYNAMODB_READ_WRITE_LAMBDAS) {
      const fn = fns[key]; if (fn) allTables.forEach(t => t.grantReadWriteData(fn));
    }
    for (const key of DYNAMODB_READ_ONLY_LAMBDAS) {
      const fn = fns[key]; if (fn) allTables.forEach(t => t.grantReadData(fn));
    }

    // ── Cognito admin permissions ─────────────────────────────────────────────

    for (const key of COGNITO_ADMIN_LAMBDAS) {
      const fn = fns[key]; if (fn) cognito.grantAdminActions(fn);
    }

    this.lambdas = fns;
  }
}
