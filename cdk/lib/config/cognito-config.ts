import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';

// ── Password policy ────────────────────────────────────────────────────────────

export const COGNITO_PASSWORD_POLICY: cognito.PasswordPolicy = {
  minLength:            8,
  requireLowercase:     true,
  requireUppercase:     false,
  requireDigits:        false,
  requireSymbols:       false,
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

// Cognito caps id/access tokens at 24h — that's the hard maximum, a 1-month token isn't possible.
// The app instead relies on the 30-day refresh token (see auth.service.ts's `refresh()`) so a session
// can last up to a month without the user re-entering their password.
export const COGNITO_TOKEN_VALIDITY = {
  accessToken:  cdk.Duration.hours(24),
  idToken:      cdk.Duration.hours(24),
  refreshToken: cdk.Duration.days(30),
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
];
