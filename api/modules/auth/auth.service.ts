import {
  AdminCreateUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import AppError from "../../shared/errors/AppError.js";
import { cognitoClient, COGNITO_CLIENT_ID, COGNITO_USER_POOL_ID } from "./cognito.client.js";
import { cognitoVerifier } from "./cognito.verifier.js";
import type { UserRepository } from "../users/users.repository.js";
import type { ParentRepository } from "../parents/repository.js";

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private parentRepository?: ParentRepository,
  ) {}

  async register(email: string, password: string) {
    try {
      await cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: email,
          MessageAction: MessageActionType.SUPPRESS,
          TemporaryPassword: password,
        }),
      );
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === "UsernameExistsException") {
        throw new AppError(409, "An account with this email already exists");
      }
      throw err;
    }

    // Set as permanent so the user is not forced to reset on first login
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      }),
    );

    return this._authenticateAndUpsert(email, password);
  }

  async login(email: string, password: string) {
    try {
      return await this._authenticateAndUpsert(email, password);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (
        error.name === "NotAuthorizedException" ||
        error.name === "UserNotFoundException"
      ) {
        throw new AppError(401, "Invalid email or password");
      }
      throw err;
    }
  }

  async me(sub: string) {
    const user = await this.userRepository.getBySub(sub);
    if (!user) throw new AppError(401, "User not found");

    if (user.role === "PARENT" && this.parentRepository) {
      const parent = await this.parentRepository.getByUserId(user.id);
      return { ...user, parent: parent ?? null };
    }

    return { ...user, parent: null };
  }

  private async _authenticateAndUpsert(email: string, password: string) {
    const result = await cognitoClient.send(
      new AdminInitiateAuthCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        ClientId: COGNITO_CLIENT_ID,
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }),
    );

    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) throw new AppError(500, "Cognito did not return a token");

    const payload = await cognitoVerifier.verify(idToken);
    const user = await this.userRepository.upsertBySub(payload.sub, email);

    return { token: idToken, user };
  }
}
