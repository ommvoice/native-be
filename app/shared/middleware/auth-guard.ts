import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { MiddlewareObj } from '@middy/core';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AppError } from '../errors/app-error';
import { env } from '../config/env';

/** Decoded Cognito JWT claims attached to the event by authGuard(). */
export interface AuthUser {
  sub: string;
  email: string;
}

export type AuthenticatedEvent = APIGatewayProxyEvent & { user: AuthUser };

/**
 * Lazy-initialised Cognito verifier — created once per Lambda container,
 * reused across warm invocations.
 */
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

/**
 * Middy middleware: verifies Cognito ID token from the `Authorization: Bearer <token>` header.
 * Attaches decoded claims to `event.user`.
 * Throws AppError(401) if missing or invalid.
 */
export function authGuard(): MiddlewareObj {
  return {
    before: async (request) => {
      const authHeader =
        request.event.headers?.['Authorization'] ??
        request.event.headers?.['authorization'];

      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError(401, 'Missing or malformed Authorization header');
      }

      const token = authHeader.slice(7);
      try {
        const payload = await getVerifier().verify(token);
        (request.event as AuthenticatedEvent).user = {
          sub:   payload.sub,
          email: (payload['email'] as string) ?? '',
        };
      } catch {
        throw new AppError(401, 'Invalid or expired token');
      }
    },
  };
}
