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
import { allLambdas } from '../config/lambda-registry';
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

    const integration = (key: string) => {
      const f = lambdas[key];
      if (!f) throw new Error(`Lambda "${key}" not found — add it to lambda-registry.ts`);
      return new apigateway.LambdaIntegration(f, LAMBDA_INTEGRATION_OPTIONS);
    };

    // Cache ensures each path segment is created once even when shared across Lambdas.
    const resourceCache = new Map<string, apigateway.Resource>();

    const getOrCreate = (segments: string[]): apigateway.Resource => {
      for (let i = 0; i < segments.length; i++) {
        const key = segments.slice(0, i + 1).join('/');
        if (!resourceCache.has(key)) {
          const parent: apigateway.IResource = i === 0
            ? this.api.root
            : resourceCache.get(segments.slice(0, i).join('/'))!;
          resourceCache.set(key, parent.addResource(segments[i]!));
        }
      }
      return resourceCache.get(segments.join('/'))!;
    };

    // ── Routes (driven by lambda-registry.ts) ─────────────────────────────────

    for (const def of allLambdas) {
      for (const route of def.routes) {
        getOrCreate(route.path).addMethod(
          route.method,
          integration(def.key),
          route.auth ? AUTH : NO_AUTH,
        );
      }
    }

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
