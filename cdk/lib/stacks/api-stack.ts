import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import type { AppConfig } from '../config/app-config';
import {
  API_CORS_OPTIONS,
  API_STAGE_OPTIONS,
  LAMBDA_INTEGRATION_OPTIONS,
} from '../config/api-gateway-config';
import { logRetentionDays } from '../config/lambda-config';
import { ApiLambda } from '../constructs/api-lambda.construct';
import { CustomDomainsConstruct } from './custom-domains-stack';

export interface ApiStackProps extends cdk.StackProps {
  config: AppConfig;
  lambdas: Record<string, lambdaNode.NodejsFunction>;
  layer:      lambda.LayerVersion;
  cognitoEnv: Record<string, string>;
}

/** REST API Gateway — one integration per Lambda, mirrors the existing Express route structure. */
export class ApiStack extends cdk.Stack {
  readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config, lambdas, layer, cognitoEnv } = props;

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName:                  config.apiName,
      description:                  `${config.appName} ${config.env} REST API`,
      deployOptions:                { stageName: config.apiStageName, ...API_STAGE_OPTIONS },
      defaultCorsPreflightOptions:  API_CORS_OPTIONS,
    });


    const stage = `api-family-${config.env}`;
    new CustomDomainsConstruct(this, {
      appConfig: config,
      restApi:   this.api,
      stage,
      aRecordSkip: true, // CNAME subdomain is sufficient; apex A record is managed elsewhere
    });

    // ── Custom authorizer ─────────────────────────────────────────────────────
    // Created here (not in LambdaStack) to avoid a cross-stack cyclic reference:
    // RequestAuthorizer.addPermission would reference this API's ARN from LambdaStack.

    const authorizerFn = new ApiLambda(this, 'AuthorizerLambda', {
      functionName:    config.prefix('authorizer'),
      entry:           path.join(__dirname, '../../..', 'app', 'lambdas', 'authorizer', 'index.ts'),
      logRetentionDays: logRetentionDays(config.env),
      layer,
      environment:     cognitoEnv,
      appEnv:          config.env,
    }).fn;

    const authorizer = new apigateway.RequestAuthorizer(this, 'Authorizer', {
      handler:         authorizerFn,
      identitySources: [apigateway.IdentitySource.header('Authorization')],
      resultsCacheTtl: cdk.Duration.minutes(5),
    });

    /** Method options with custom authorizer — use for protected endpoints. */
    const AUTH: apigateway.MethodOptions = {
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer,
    };

    /** Method options with no auth — use for public endpoints. */
    const NO_AUTH: apigateway.MethodOptions = {
      authorizationType: apigateway.AuthorizationType.NONE,
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const fn = (key: string) => {
      const f = lambdas[key];
      if (!f) throw new Error(`Lambda "${key}" not registered in LambdaStack`);
      return new apigateway.LambdaIntegration(f, LAMBDA_INTEGRATION_OPTIONS);
    };

    const resource = (parent: apigateway.IResource, path: string) =>
      parent.addResource(path);

    // ── /auth ─────────────────────────────────────────────────────────────────
    const auth = resource(this.api.root, 'auth');
    resource(auth, 'register').addMethod('POST', fn('authRegister'), NO_AUTH);
    resource(auth, 'login').addMethod('POST',    fn('authLogin'),    NO_AUTH);
    resource(auth, 'me').addMethod('GET',        fn('authMe'),       AUTH);

    // ── /users ────────────────────────────────────────────────────────────────
    const users = resource(this.api.root, 'users');
    resource(users, 'me').addMethod('GET', fn('usersGetMe'), AUTH);

    // ── /parents ──────────────────────────────────────────────────────────────
    const parents        = resource(this.api.root, 'parents');
    const parentById     = resource(parents, '{id}');
    parentById.addMethod('GET', fn('parentsGet'), AUTH);
    resource(parentById, 'search-radius').addMethod('PUT', fn('parentsUpdateSearchRadius'), AUTH);
    resource(parentById, 'interests').addMethod('PUT',     fn('parentsUpdateInterests'),    AUTH);

    // ── /onboard-parents ──────────────────────────────────────────────────────
    resource(this.api.root, 'onboard-parents').addMethod('POST', fn('onboardParents'), NO_AUTH);

    // ── /children ─────────────────────────────────────────────────────────────
    const children    = resource(this.api.root, 'children');
    children.addMethod('POST', fn('childrenCreate'), AUTH);
    const childById   = resource(children, '{id}');
    childById.addMethod('GET',  fn('childrenGet'),    AUTH);
    childById.addMethod('PUT',  fn('childrenUpdate'), AUTH);
    resource(childById, 'interests').addMethod('PUT', fn('childrenUpdateInterests'), AUTH);

    // ── /interests ────────────────────────────────────────────────────────────
    const interests = resource(this.api.root, 'interests');
    resource(interests, 'categories').addMethod('GET',     fn('interestsListCategories'),    NO_AUTH);
    resource(interests, 'sub-categories').addMethod('GET', fn('interestsListSubCategories'), NO_AUTH);

    // ── /skills ───────────────────────────────────────────────────────────────
    resource(this.api.root, 'skills').addMethod('GET', fn('skillsList'), NO_AUTH);

    // ── /themes ───────────────────────────────────────────────────────────────
    const themes = resource(this.api.root, 'themes');
    themes.addMethod('GET', fn('themesList'), NO_AUTH);
    resource(themes, 'variants').addMethod('GET', fn('themesListVariants'), NO_AUTH);

    // ── /facilities ───────────────────────────────────────────────────────────
    resource(this.api.root, 'facilities').addMethod('GET', fn('facilitiesList'), NO_AUTH);

    // ── /opportunity ──────────────────────────────────────────────────────────
    const opportunity = resource(this.api.root, 'opportunity');

    const addOpportunityRoutes = (
      parent: apigateway.Resource,
      listKey: string,
      getKey: string,
    ) => {
      parent.addMethod('GET', fn(listKey), NO_AUTH);
      resource(parent, '{id}').addMethod('GET', fn(getKey), NO_AUTH);
    };

    addOpportunityRoutes(resource(opportunity, 'venues'),  'opportunityVenuesV2List', 'opportunityVenuesV2Get');
    addOpportunityRoutes(resource(opportunity, 'events'),  'opportunityEventsV2List', 'opportunityEventsV2Get');
    addOpportunityRoutes(resource(opportunity, 'clubs'),   'opportunityClubsV2List',  'opportunityClubsV2Get');
    addOpportunityRoutes(resource(opportunity, 'routes'),  'opportunityRoutesV2List', 'opportunityRoutesV2Get');

    // ── /recommendations-v2 ───────────────────────────────────────────────────
    const recsV2 = resource(this.api.root, 'recommendations-v2');
    recsV2.addMethod('GET', fn('recommendationsV2Get'), AUTH);
    resource(recsV2, 'nearby').addMethod('GET', fn('recommendationsV2Nearby'), AUTH);

    // ── /wishlists ────────────────────────────────────────────────────────────
    const wishlists = resource(this.api.root, 'wishlists');
    wishlists.addMethod('GET',  fn('wishlistsList'),   AUTH);
    wishlists.addMethod('POST', fn('wishlistsCreate'), AUTH);

    // ── /search ───────────────────────────────────────────────────────────────
    resource(this.api.root, 'search').addMethod('GET', fn('searchOpportunities'), AUTH);

    // ── /weather ──────────────────────────────────────────────────────────────
    resource(this.api.root, 'weather').addMethod('GET', fn('weatherGet'), NO_AUTH);

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: `${config.appName} ${config.env} API base URL (default)`,
      exportName: config.prefix('api-url'),
    });

    new cdk.CfnOutput(this, 'ApiDomainUrl', {
      value: `https://${stage}.${config.domain}`,
      description: `${config.appName} ${config.env} API custom domain URL`,
      exportName: config.prefix('api-domain-url'),
    });
  }
}
