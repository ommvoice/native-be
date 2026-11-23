import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';

// ── Password policy ────────────────────────────────────────────────────────────

// Mirrors the app's signup rules (native-fe-v0 src/lib/utils/validation.ts). Only applies to new
// passwords — existing users keep signing in with their current one.
export const COGNITO_PASSWORD_POLICY: cognito.PasswordPolicy = {
  minLength:            12,
  requireLowercase:     true,
  requireUppercase:     true,
  requireDigits:        true,
  requireSymbols:       true,
  tempPasswordValidity: cdk.Duration.days(7),
};

// ── Auth flows ─────────────────────────────────────────────────────────────────

/** ADMIN_USER_PASSWORD_AUTH only — used by auth.service.ts AdminInitiateAuthCommand. */
export const COGNITO_AUTH_FLOWS: cognito.AuthFlow = {
  adminUserPassword: true,
  userPassword:      false,
  userSrp:           false,
  custom:            false,
};

// ── Token validity ─────────────────────────────────────────────────────────────

export const COGNITO_TOKEN_VALIDITY = {
  accessToken:  cdk.Duration.hours(1),
  idToken:      cdk.Duration.hours(1),
  // "Log in once, stay logged in" (client requirement): Cognito 1 year. Sessions
  // still end on logout (RevokeToken), password reset (global sign-out) and account deletion.
  refreshToken: cdk.Duration.days(365),
} as const;

// ── User pool settings ─────────────────────────────────────────────────────────

export const COGNITO_SIGN_IN_ALIASES: cognito.SignInAliases = {
  email: true,
};

export const COGNITO_AUTO_VERIFY: cognito.AutoVerifiedAttrs = {
  email: true,
};

export const COGNITO_STANDARD_ATTRIBUTES: cognito.StandardAttributes = {
  email: { required: true, mutable: true },
};

// ── IAM actions granted to admin Lambdas ──────────────────────────────────────

export const COGNITO_ADMIN_IAM_ACTIONS: string[] = [
  'cognito-idp:AdminCreateUser',
  'cognito-idp:AdminSetUserPassword',
  'cognito-idp:AdminInitiateAuth',
  'cognito-idp:AdminGetUser',
  'cognito-idp:AdminDeleteUser',
  'cognito-idp:AdminUserGlobalSignOut',
];
