import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as path from 'path';
import { Construct } from 'constructs';
import { AppConfig, TABLE_ENV_VARS } from '../config/app-config';
import { LAMBDA_RUNTIME, LAYER_BUNDLING, S3_BUNDLED_MODULES, logRetentionDays } from '../config/lambda-config';
import { allLambdas } from '../config/lambda-registry';
import { ApiLambda } from '../constructs/api-lambda.construct';
import type { CognitoStack } from './cognito-stack';

export interface LambdaStackProps extends cdk.StackProps {
  config: AppConfig;
  tables: Record<string, dynamodb.Table>;
  uploadsBucket: s3.IBucket;
  cognito: CognitoStack;
}

export class LambdaStack extends cdk.Stack {
  readonly lambdas:    Record<string, lambdaNode.NodejsFunction>;
  readonly layer:      lambda.LayerVersion;
  readonly cognitoEnv: Record<string, string>;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { config, tables, cognito, uploadsBucket } = props;

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
      GOOGLE_MAPS_API_KEY: config.googleMapsApiKey,
    };

    const uploadsEnv = {
      UPLOADS_BUCKET: uploadsBucket.bucketName,
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
      bundledModules: string[] = [],
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
        bundledModules,
      });
      fns[key] = construct.fn;
      return construct.fn;
    };

    // ── Register all Lambdas from registry ────────────────────────────────────

    for (const def of allLambdas) {
      const extraEnv = {
        ...(def.env?.cognito     ? cognitoEnv     : {}),
        ...(def.env?.externalApi ? externalApiEnv : {}),
        ...(def.env?.uploads     ? uploadsEnv     : {}),
      };

      const fn = register(
        def.key,
        config.prefix(def.name),
        def.entry,
        extraEnv,
        def.overrides ?? {},
        def.permissions.s3 ? S3_BUNDLED_MODULES : [],
      );

      if (def.permissions.dynamodb === 'readWrite') allTables.forEach(t => t.grantReadWriteData(fn));
      if (def.permissions.dynamodb === 'read')      allTables.forEach(t => t.grantReadData(fn));
      if (def.permissions.cognito)                  cognito.grantAdminActions(fn);
      if (def.permissions.s3 === 'put')             uploadsBucket.grantPut(fn);
      if (def.permissions.s3 === 'read')            uploadsBucket.grantRead(fn);
      if (def.permissions.s3 === 'readWrite')       uploadsBucket.grantReadWrite(fn);
    }

    this.layer      = layer;
    this.cognitoEnv = cognitoEnv;
    this.lambdas    = fns;
  }
}
