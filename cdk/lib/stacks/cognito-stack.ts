import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import type { AppConfig } from '../config/app-config';
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

    // ── User Pool ─────────────────────────────────────────────────────────────

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName:         config.cognitoNames.userPool,
      selfSignUpEnabled:    false,
      signInAliases:        COGNITO_SIGN_IN_ALIASES,
      autoVerify:           COGNITO_AUTO_VERIFY,
      standardAttributes:   COGNITO_STANDARD_ATTRIBUTES,
      passwordPolicy:       COGNITO_PASSWORD_POLICY,
      accountRecovery:      cognito.AccountRecovery.EMAIL_ONLY,
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
