#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppConfig } from '../lib/config/app-config';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { TableStack } from '../lib/stacks/table-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { getAppContext } from '../lib/utils';

const app = new cdk.App();

// const appName = app.node.tryGetContext('appName') as string ?? 'native-be';
// const env     = app.node.tryGetContext('env')     as string ?? 'dev';
// const mapboxToken = app.node.tryGetContext('mapboxAccessToken') as string ?? '';
// const weatherApiKey = app.node.tryGetContext('weatherApiKey') as string ?? '';

const {appName, environment, mapboxAccessToken, weatherApiKey, awsAccountId, awsProfileRegion} = getAppContext(app);

// if (!appName || !env) {
//   throw new Error('CDK context must provide "appName" and "env". Run: cdk deploy --context env=staging');
// }

const config = new AppConfig({
  appName,
  env: environment,
  mapboxAccessToken,
  weatherApiKey,
  awsAccount: awsAccountId,
  awsRegion:  awsProfileRegion,
  // awsAccount: process.env.CDK_DEFAULT_ACCOUNT,
});

const cdkEnv: cdk.Environment = {
  account: config.awsAccount,
  region:  config.awsRegion,
};

// ── Stack 1: Cognito (User Pool + Client) ─────────────────────────────────────
const cognitoStack = new CognitoStack(app, config.stackNames.cognito, { config, env: cdkEnv });

// ── Stack 2: DynamoDB tables ──────────────────────────────────────────────────
const tableStack = new TableStack(app, config.stackNames.tables, { config, env: cdkEnv });

// ── Stack 3: Lambda functions + Layer ─────────────────────────────────────────
const lambdaStack = new LambdaStack(app, config.stackNames.lambdas, {
  config,
  tables:  tableStack.tables,
  cognito: cognitoStack,          // User Pool ID + Client ID injected here
  env:     cdkEnv,
});
lambdaStack.addDependency(cognitoStack);
lambdaStack.addDependency(tableStack);

// ── Stack 4: API Gateway ──────────────────────────────────────────────────────
const apiStack = new ApiStack(app, config.stackNames.api, {
  config,
  lambdas: lambdaStack.lambdas,
  env:     cdkEnv,
});
apiStack.addDependency(lambdaStack);

app.synth();
