import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import { Construct } from 'constructs';
import type { AppConfig } from '../config/app-config';
import { LAMBDA_RUNTIME, LAMBDA_ARCHITECTURE, getBundlingOptions, logRetentionDays } from '../config/lambda-config';
import {
  COGNITO_PASSWORD_POLICY,
  COGNITO_AUTH_FLOWS,
  COGNITO_TOKEN_VALIDITY,
  COGNITO_SIGN_IN_ALIASES,
  COGNITO_AUTO_VERIFY,
  COGNITO_STANDARD_ATTRIBUTES,
  COGNITO_ADMIN_IAM_ACTIONS,
} from '../config/cognito-config';

export interface CognitoStackProps extends cdk.StackProps {
  config: AppConfig;
}

/** Outputs passed to LambdaStack so Cognito IDs never need to be hardcoded. */
export interface CognitoOutputs {
  userPoolId:       string;
  userPoolClientId: string;
  userPoolArn:      string;
}

export class CognitoStack extends cdk.Stack {
  readonly userPool: cognito.UserPool;
  readonly userPoolClient: cognito.UserPoolClient;
  readonly outputs: CognitoOutputs;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const { config } = props;
    const isProd = config.env === 'prod';

    // ── CustomMessage trigger (HTML email templates) ──────────────────────────
    // Lives in this stack, not LambdaStack: LambdaStack already depends on Cognito, so wiring one
    // of its functions as a pool trigger would create a cycle. Imports no third-party packages,
    // so it's bundled standalone without the shared layer.

    const repoRoot = path.join(__dirname, '../../..');
    const customMessageName = config.prefix('cognito-custom-message');
    const customMessageFn = new lambdaNode.NodejsFunction(this, 'CustomMessageTrigger', {
      functionName:     customMessageName,
      description:      'Cognito CustomMessage trigger — renders HTML email templates',
      entry:            path.join(repoRoot, 'app', 'lambdas', 'cognito-triggers', 'custom-message.ts'),
      handler:          'handler',
      runtime:          LAMBDA_RUNTIME,
      architecture:     LAMBDA_ARCHITECTURE,
      memorySize:       256,
      timeout:          cdk.Duration.seconds(5),
      logGroup:         new logs.LogGroup(this, 'CustomMessageTriggerLogs', {
        logGroupName:  `/aws/lambda/${customMessageName}`,
        retention:     logRetentionDays(config.env),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      projectRoot:      repoRoot,
      depsLockFilePath: path.join(repoRoot, 'package-lock.json'),
      bundling: {
        ...getBundlingOptions(config.env),
        tsconfig: path.join(repoRoot, 'app', 'tsconfig.json'),
      },
    });

    // ── User Pool ─────────────────────────────────────────────────────────────

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName:         config.cognitoNames.userPool,
      selfSignUpEnabled:    false,
      signInAliases:        COGNITO_SIGN_IN_ALIASES,
      autoVerify:           COGNITO_AUTO_VERIFY,
      standardAttributes:   COGNITO_STANDARD_ATTRIBUTES,
      passwordPolicy:       COGNITO_PASSWORD_POLICY,
      accountRecovery:      cognito.AccountRecovery.EMAIL_ONLY,
      // Send Cognito emails (password reset codes) through SES from our verified sender instead of
      // Cognito's default no-reply address. While SES is in sandbox mode, mail only reaches
      // SES-verified recipients — request production access before going live.
      email: cognito.UserPoolEmail.withSES({
        fromEmail: config.fromEmail,
        fromName:  'Native Family',
        sesRegion: config.awsRegion ?? cdk.Stack.of(this).region,
      }),
      lambdaTriggers: {
        customMessage: customMessageFn,
      },
      removalPolicy:        isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ── User Pool Client ──────────────────────────────────────────────────────

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool:             this.userPool,
      userPoolClientName:   config.cognitoNames.userPoolClient,
      generateSecret:       false,
      authFlows:            COGNITO_AUTH_FLOWS,
      accessTokenValidity:  COGNITO_TOKEN_VALIDITY.accessToken,
      idTokenValidity:      COGNITO_TOKEN_VALIDITY.idToken,
      refreshTokenValidity: COGNITO_TOKEN_VALIDITY.refreshToken,
      // Unknown emails get the same responses as real ones (no account enumeration via
      // forgot-password or login).
      preventUserExistenceErrors: true,
    });

    // ── Outputs ───────────────────────────────────────────────────────────────

    this.outputs = {
      userPoolId:       this.userPool.userPoolId,
      userPoolClientId: this.userPoolClient.userPoolClientId,
      userPoolArn:      this.userPool.userPoolArn,
    };

    new cdk.CfnOutput(this, 'UserPoolId', {
      value:       this.userPool.userPoolId,
      description: `${config.appName} ${config.env} Cognito User Pool ID`,
      exportName:  config.prefix('user-pool-id'),
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value:       this.userPoolClient.userPoolClientId,
      description: `${config.appName} ${config.env} Cognito User Pool Client ID`,
      exportName:  config.prefix('user-pool-client-id'),
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value:      this.userPool.userPoolArn,
      exportName: config.prefix('user-pool-arn'),
    });
  }

  /**
   * Grant a Lambda the Cognito admin actions defined in COGNITO_ADMIN_IAM_ACTIONS.
   * Called by LambdaStack after functions are registered.
   */
  grantAdminActions(fn: lambdaNode.NodejsFunction): void {
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions:   COGNITO_ADMIN_IAM_ACTIONS,
        resources: [this.userPool.userPoolArn],
      }),
    );
  }
}
