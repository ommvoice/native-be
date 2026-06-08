import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { Construct } from 'constructs';
import { AppConfig, TABLE_ENV_VARS } from '../config/app-config';
import { LAMBDA_RUNTIME, LAYER_BUNDLING, logRetentionDays } from '../config/lambda-config';
import { allLambdas } from '../config/lambda-registry';
import { ApiLambda } from '../constructs/api-lambda.construct';
import type { CognitoStack } from './cognito-stack';

export interface LambdaStackProps extends cdk.StackProps {
  config: AppConfig;
  tables: Record<string, dynamodb.Table>;
  cognito: CognitoStack;
}

export class LambdaStack extends cdk.Stack {
  readonly lambdas:    Record<string, lambdaNode.NodejsFunction>;
  readonly layer:      lambda.LayerVersion;
  readonly cognitoEnv: Record<string, string>;

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
      ...Object.fromEntries(
        Object.entries(TABLE_ENV_VARS).map(([key, envVar]) => [envVar, tables[key]!.tableName]),
      ),
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
    const allTables  = Object.values(tables);
    const fns: Record<string, lambdaNode.NodejsFunction> = {};

    // ── Helper ────────────────────────────────────────────────────────────────

    const register = (
      key:          string,
      functionName: string,
      relPath:      string,
      extraEnv:     Record<string, string> = {},
      overrides:    { memoryMb?: number; timeoutSeconds?: number } = {},
    ): lambdaNode.NodejsFunction => {
      const construct = new ApiLambda(this, `Lambda_${key}`, {
        functionName,
        entry:            path.join(lambdasDir, relPath),
        logRetentionDays: retention,
        layer,
        environment:      { ...tableEnv, ...extraEnv },
        memoryMb:         overrides.memoryMb,
        timeoutSeconds:   overrides.timeoutSeconds,
        appEnv:           config.env,
      });
      fns[key] = construct.fn;
      return construct.fn;
    };

    // ── Register all Lambdas from registry ────────────────────────────────────

    for (const def of allLambdas) {
      const extraEnv = {
        ...(def.env?.cognito     ? cognitoEnv     : {}),
        ...(def.env?.externalApi ? externalApiEnv : {}),
      };

      const fn = register(
        def.key,
        config.prefix(def.name),
        def.entry,
        extraEnv,
        def.overrides ?? {},
      );

      if (def.permissions.dynamodb === 'readWrite') allTables.forEach(t => t.grantReadWriteData(fn));
      if (def.permissions.dynamodb === 'read')      allTables.forEach(t => t.grantReadData(fn));
      if (def.permissions.cognito)                  cognito.grantAdminActions(fn);
    }

    this.layer      = layer;
    this.cognitoEnv = cognitoEnv;
    this.lambdas    = fns;
  }
}
