import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import type { AppConfig } from '../config/app-config';
import {
  API_CORS_OPTIONS,
  API_STAGE_OPTIONS,
  LAMBDA_INTEGRATION_OPTIONS,
} from '../config/api-gateway-config';

export interface ApiStackProps extends cdk.StackProps {
  config: AppConfig;
  lambdas: Record<string, lambdaNode.NodejsFunction>;
}

/** REST API Gateway — one integration per Lambda, mirrors the existing Express route structure. */
export class ApiStack extends cdk.Stack {
  readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config, lambdas } = props;

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName:                  config.apiName,
      description:                  `${config.appName} ${config.env} REST API`,
      deployOptions:                { stageName: config.apiStageName, ...API_STAGE_OPTIONS },
      defaultCorsPreflightOptions:  API_CORS_OPTIONS,
    });

    // ── Helper ────────────────────────────────────────────────────────────────

    const fn = (key: string) => {
      const f = lambdas[key];
      if (!f) throw new Error(`Lambda "${key}" not registered in LambdaStack`);
      return new apigateway.LambdaIntegration(f, LAMBDA_INTEGRATION_OPTIONS);
    };

    const resource = (parent: apigateway.IResource, path: string) =>
      parent.addResource(path);

    // ── /auth ─────────────────────────────────────────────────────────────────
    const auth = resource(this.api.root, 'auth');
    resource(auth, 'register').addMethod('POST', fn('authRegister'));
    resource(auth, 'login').addMethod('POST', fn('authLogin'));
    resource(auth, 'me').addMethod('GET', fn('authMe'));

    // ── /users ────────────────────────────────────────────────────────────────
    const users = resource(this.api.root, 'users');
    resource(users, 'me').addMethod('GET', fn('usersGetMe'));

    // ── /parents ──────────────────────────────────────────────────────────────
    const parents        = resource(this.api.root, 'parents');
    const parentById     = resource(parents, '{id}');
    parentById.addMethod('GET', fn('parentsGet'));
    resource(parentById, 'search-radius').addMethod('PUT', fn('parentsUpdateSearchRadius'));
    resource(parentById, 'interests').addMethod('PUT', fn('parentsUpdateInterests'));

    // ── /onboard-parents ──────────────────────────────────────────────────────
    resource(this.api.root, 'onboard-parents').addMethod('POST', fn('onboardParents'));

    // ── /children ─────────────────────────────────────────────────────────────
    const children    = resource(this.api.root, 'children');
    children.addMethod('POST', fn('childrenCreate'));
    const childById   = resource(children, '{id}');
    childById.addMethod('GET',  fn('childrenGet'));
    childById.addMethod('PUT',  fn('childrenUpdate'));
    resource(childById, 'interests').addMethod('PUT', fn('childrenUpdateInterests'));

    // ── /interests ────────────────────────────────────────────────────────────
    const interests = resource(this.api.root, 'interests');
    resource(interests, 'categories').addMethod('GET',     fn('interestsListCategories'));
    resource(interests, 'sub-categories').addMethod('GET', fn('interestsListSubCategories'));

    // ── /skills ───────────────────────────────────────────────────────────────
    resource(this.api.root, 'skills').addMethod('GET', fn('skillsList'));

    // ── /themes ───────────────────────────────────────────────────────────────
    const themes = resource(this.api.root, 'themes');
    themes.addMethod('GET', fn('themesList'));
    resource(themes, 'variants').addMethod('GET', fn('themesListVariants'));

    // ── /facilities ───────────────────────────────────────────────────────────
    resource(this.api.root, 'facilities').addMethod('GET', fn('facilitiesList'));

    // ── /opportunity ──────────────────────────────────────────────────────────
    const opportunity = resource(this.api.root, 'opportunity');

    const addOpportunityRoutes = (
      parent: apigateway.Resource,
      listKey: string,
      getKey: string,
    ) => {
      parent.addMethod('GET', fn(listKey));
      resource(parent, '{id}').addMethod('GET', fn(getKey));
    };

    addOpportunityRoutes(resource(opportunity, 'venues'),  'opportunityVenuesV2List', 'opportunityVenuesV2Get');
    addOpportunityRoutes(resource(opportunity, 'events'),  'opportunityEventsV2List', 'opportunityEventsV2Get');
    addOpportunityRoutes(resource(opportunity, 'clubs'),   'opportunityClubsV2List',  'opportunityClubsV2Get');
    addOpportunityRoutes(resource(opportunity, 'routes'),  'opportunityRoutesV2List', 'opportunityRoutesV2Get');

    // ── /recommendations-v2 ───────────────────────────────────────────────────
    const recsV2 = resource(this.api.root, 'recommendations-v2');
    recsV2.addMethod('GET', fn('recommendationsV2Get'));
    resource(recsV2, 'nearby').addMethod('GET', fn('recommendationsV2Nearby'));

    // ── /wishlists ────────────────────────────────────────────────────────────
    const wishlists = resource(this.api.root, 'wishlists');
    wishlists.addMethod('GET',  fn('wishlistsList'));
    wishlists.addMethod('POST', fn('wishlistsCreate'));

    // ── /search ───────────────────────────────────────────────────────────────
    resource(this.api.root, 'search').addMethod('GET', fn('searchOpportunities'));

    // ── /weather ──────────────────────────────────────────────────────────────
    resource(this.api.root, 'weather').addMethod('GET', fn('weatherGet'));

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: `${config.appName} ${config.env} API base URL`,
      exportName: config.prefix('api-url'),
    });
  }
}
