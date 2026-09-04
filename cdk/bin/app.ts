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

const { appName, environment, mapboxAccessToken, weatherApiKey, googleMapsApiKey, awsAccountId, awsProfileRegion, hostedZoneId, domain, certificateArn } = getAppContext(app);

const config = new AppConfig({
  appName,
  env: environment,
  mapboxAccessToken,
  weatherApiKey,
  googleMapsApiKey,
  awsAccount: awsAccountId,
  awsRegion: awsProfileRegion,
  hostedZoneId,
  domain,
  certificateArn,
});

const cdkEnv: cdk.Environment = {
  account: config.awsAccount,
  region: config.awsRegion,
};

// ── Stack 1: Cognito (User Pool + Client) ─────────────────────────────────────
const cognitoStack = new CognitoStack(app, config.stackNames.cognito, { config, env: cdkEnv });

// ── Stack 2: DynamoDB tables ──────────────────────────────────────────────────
const tableStack = new TableStack(app, config.stackNames.tables, { config, env: cdkEnv });

// ── Stack 3: Lambda functions + Layer ─────────────────────────────────────────
const lambdaStack = new LambdaStack(app, config.stackNames.lambdas, {
  config,
  tables: tableStack.tables,
  cognito: cognitoStack,          // User Pool ID + Client ID injected here
  env: cdkEnv,
});
lambdaStack.addDependency(cognitoStack);
lambdaStack.addDependency(tableStack);

// ── Stack 4: API Gateway ──────────────────────────────────────────────────────
const apiStack = new ApiStack(app, config.stackNames.api, {
  config,
  lambdas:    lambdaStack.lambdas,
  layer:      lambdaStack.layer,
  cognitoEnv: lambdaStack.cognitoEnv,
  env: cdkEnv,
});
apiStack.addDependency(lambdaStack);

app.synth();
