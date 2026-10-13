import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ForgotPasswordCommand,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppError } from '../shared/errors/app-error';
import { env } from '../shared/config/env';
import { UserRepository } from '../repositories/user.repository';
import { logger } from '../shared/utils/logger';

let _cognitoClient: CognitoIdentityProviderClient | null = null;
function getCognito() {
  if (!_cognitoClient) {
    _cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION ?? 'eu-west-2' });
  }
  return _cognitoClient;
}

let _verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;
function getVerifier() {
  if (!_verifier) {
    _verifier = CognitoJwtVerifier.create({
      userPoolId: env.cognitoUserPoolId(),
      clientId:   env.cognitoClientId(),
      tokenUse:   'id',
    });
  }
  return _verifier;
}

export class AuthService {
  constructor(private readonly userRepo: UserRepository) {}

  async register(email: string, password: string) {
    try {
      await getCognito().send(
        new AdminCreateUserCommand({
          UserPoolId:    env.cognitoUserPoolId(),
          Username:      email,
          MessageAction: MessageActionType.SUPPRESS,
          TemporaryPassword: password,
          // Marked verified up front: Cognito's ForgotPassword only sends codes to a verified
          // email, and signup doesn't (yet) run its own email-verification step.
          UserAttributes: [
            { Name: 'email',          Value: email },
            { Name: 'email_verified', Value: 'true' },
          ],
        }),
      );
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'UsernameExistsException') {
        throw new AppError(409, 'An account with this email already exists');
      }
      throw err;
    }

    await getCognito().send(
      new AdminSetUserPasswordCommand({
        UserPoolId: env.cognitoUserPoolId(),
        Username:   email,
        Password:   password,
        Permanent:  true,
      }),
    );

    return this._authenticateAndUpsert(email, password);
  }

  async login(email: string, password: string) {
    try {
      return await this._authenticateAndUpsert(email, password);
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAuthorizedException' || name === 'UserNotFoundException') {
        throw new AppError(401, 'Invalid email or password');
      }
      throw err;
    }
  }

  /**
   * Starts Cognito's forgot-password flow — Cognito emails a 6-digit code (HTML from the
   * CustomMessage trigger, sent via SES). Deliberately silent about whether the account exists:
   * the client has preventUserExistenceErrors on, and an unverified email is logged, not surfaced.
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await getCognito().send(
        new ForgotPasswordCommand({ ClientId: env.cognitoClientId(), Username: email }),
      );
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'LimitExceededException' || name === 'TooManyRequestsException') {
        throw new AppError(429, 'Too many reset requests. Please try again later.');
      }
      if (name === 'InvalidParameterException' || name === 'UserNotFoundException') {
        // Unverified email (account predates email_verified backfill) or unknown user — no email
        // can be sent, but the caller gets the same generic response either way.
        logger.warn('Forgot password: no code sent', { name, message: (err as Error).message });
        return;
      }
      throw err;
    }
  }

  /** Completes the reset with the emailed code. Existing sessions/refresh tokens are left as-is. */
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await getCognito().send(
        new ConfirmForgotPasswordCommand({
          ClientId:         env.cognitoClientId(),
          Username:         email,
          ConfirmationCode: code,
          Password:         newPassword,
        }),
      );
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      switch (name) {
        case 'CodeMismatchException':
        case 'UserNotFoundException':
          throw new AppError(400, 'That code is incorrect. Please check it and try again.');
        case 'ExpiredCodeException':
          throw new AppError(400, 'That code has expired. Please request a new one.');
        case 'InvalidPasswordException':
          throw new AppError(400, (err as Error).message || 'Password does not meet the requirements.');
        case 'LimitExceededException':
        case 'TooManyFailedAttemptsException':
        case 'TooManyRequestsException':
          throw new AppError(429, 'Too many attempts. Please try again later.');
        default:
          throw err;
      }
    }
  }

  async me(sub: string) {
    const user = await this.userRepo.getBySub(sub);
    if (!user) throw new AppError(401, 'User not found');
    return user;
  }

  /**
   * Exchanges a still-valid refresh token for a new id token, without the user re-entering their
   * password. Cognito doesn't rotate the refresh token on this flow — the same one keeps working
   * until it hits its own 30-day validity (see COGNITO_TOKEN_VALIDITY), so the client just keeps
   * calling this each time the short-lived id token (24h) expires.
   */
  async refresh(refreshToken: string) {
    let result;
    try {
      result = await getCognito().send(
        new AdminInitiateAuthCommand({
          UserPoolId: env.cognitoUserPoolId(),
          ClientId:   env.cognitoClientId(),
          AuthFlow:   'REFRESH_TOKEN_AUTH',
          AuthParameters: { REFRESH_TOKEN: refreshToken },
        }),
      );
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAuthorizedException') {
        throw new AppError(401, 'Refresh token is invalid or expired');
      }
      throw err;
    }

    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) throw new AppError(500, 'Cognito did not return a token');

    await getVerifier().verify(idToken);

    return { token: idToken };
  }

  /** Removes the Cognito login. Username is the email we registered with (see register()).
   * Already-gone users are treated as success so a retried account deletion can finish. */
  async deleteCognitoUser(username: string) {
    try {
      await getCognito().send(
        new AdminDeleteUserCommand({
          UserPoolId: env.cognitoUserPoolId(),
          Username:   username,
        }),
      );
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'UserNotFoundException') return;
      throw err;
    }
  }

  private async _authenticateAndUpsert(email: string, password: string) {
    const result = await getCognito().send(
      new AdminInitiateAuthCommand({
        UserPoolId: env.cognitoUserPoolId(),
        ClientId:   env.cognitoClientId(),
        AuthFlow:   'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    );

    const idToken      = result.AuthenticationResult?.IdToken;
    const refreshToken = result.AuthenticationResult?.RefreshToken;
    if (!idToken || !refreshToken) throw new AppError(500, 'Cognito did not return a token');

    const payload = await getVerifier().verify(idToken);
    const user    = await this.userRepo.upsertBySub(payload.sub, email);

    return { token: idToken, refreshToken, user };
  }
}
