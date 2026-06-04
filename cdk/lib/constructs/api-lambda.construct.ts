import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import {
  LAMBDA_RUNTIME,
  LAMBDA_ARCHITECTURE,
  LAMBDA_DEFAULTS,
  getBundlingOptions,
} from '../config/lambda-config';

// CDK runs as CommonJS — __dirname is available.
// cdk/lib/constructs  →  cdk/lib  →  cdk  →  repo root
const REPO_ROOT = path.join(__dirname, '../../..');

export interface ApiLambdaProps {
  /** Full function name, e.g. "native-be-staging-auth-register". */
  functionName: string;
  /** Absolute path to the Lambda handler .ts entry file. */
  entry: string;
  /** Name of the exported handler function (default: "handler"). */
  handlerName?: string;
  /** CloudWatch log retention in days. */
  logRetentionDays: number;
  /** Lambda shared layer. */
  layer: lambda.ILayerVersion;
  /** Environment variables injected at runtime. */
  environment: Record<string, string>;
  /** Memory in MB — defaults to LAMBDA_DEFAULTS.memoryMb. */
  memoryMb?: number;
  /** Timeout in seconds — defaults to LAMBDA_DEFAULTS.timeoutSeconds. */
  timeoutSeconds?: number;
  /** Optional description. */
  description?: string;
  /** Deployment environment — controls minification and source maps. */
  appEnv: string;
}

/** Reusable construct: NodejsFunction + dedicated CloudWatch log group. */
export class ApiLambda extends Construct {
  readonly fn: lambdaNode.NodejsFunction;
  readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName:  `/aws/lambda/${props.functionName}`,
      retention:     props.logRetentionDays,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.fn = new lambdaNode.NodejsFunction(this, 'Fn', {
      functionName:     props.functionName,
      description:      props.description ?? props.functionName,
      entry:            props.entry,
      handler:          props.handlerName ?? 'handler',
      runtime:          LAMBDA_RUNTIME,
      architecture:     LAMBDA_ARCHITECTURE,
      memorySize:       props.memoryMb      ?? LAMBDA_DEFAULTS.memoryMb,
      timeout:          cdk.Duration.seconds(props.timeoutSeconds ?? LAMBDA_DEFAULTS.timeoutSeconds),
      layers:           [props.layer],
      logGroup:         this.logGroup,
      environment:      props.environment,
      projectRoot:      REPO_ROOT,
      depsLockFilePath: path.join(REPO_ROOT, 'package-lock.json'),
      bundling: {
        ...getBundlingOptions(props.appEnv),
        tsconfig: path.join(REPO_ROOT, 'app', 'tsconfig.json'),
        // Polyfill __dirname / __filename for any transitive dep that still uses them
        // (ESM removes these globals; this shim restores them via import.meta.url)
        banner: 'import{fileURLToPath}from"node:url";import{dirname}from"node:path";const __filename=fileURLToPath(import.meta.url);const __dirname=dirname(__filename);',
      },
    });
  }
}
