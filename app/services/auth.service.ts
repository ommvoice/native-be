import {
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppError } from '../shared/errors/app-error';
import { env } from '../shared/config/env';
import { UserRepository } from '../repositories/user.repository';

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

  async me(sub: string) {
    const user = await this.userRepo.getBySub(sub);
    if (!user) throw new AppError(401, 'User not found');
    return user;
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

    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) throw new AppError(500, 'Cognito did not return a token');

    const payload = await getVerifier().verify(idToken);
    const user    = await this.userRepo.upsertBySub(payload.sub, email);

    return { token: idToken, user };
  }
}
