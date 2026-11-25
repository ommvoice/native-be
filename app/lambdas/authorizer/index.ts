import { CognitoJwtVerifier } from 'aws-jwt-verify';
import {
  CognitoJwtInvalidClientIdError,
  CognitoJwtInvalidTokenUseError,
  FetchError,
  JwksNotAvailableInCacheError,
  JwtExpiredError,
  JwtInvalidIssuerError,
  JwtInvalidSignatureAlgorithmError,
  JwtInvalidSignatureError,
  JwtNotBeforeError,
  JwtParseError,
  JwtWithoutValidKidError,
  KidNotFoundInJwksError,
  type FailedAssertionError,
} from 'aws-jwt-verify/error';
import type { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { env } from '../../shared/config/env';
import { logger } from '../../shared/utils/logger';

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

/** Broad wildcard so the cached policy covers the entire API stage. */
function wildcardArn(methodArn: string): string {
  const parts = methodArn.split('/');
  return `${parts[0]}/${parts[1]}/*/*`;
}

function deny(methodArn: string): APIGatewayAuthorizerResult {
  return {
    principalId: 'unknown',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: 'Deny', Resource: methodArn }],
    },
  };
}

/**
 * Why a request was rejected — one log line per rejection (`Auth rejected`), so CloudWatch shows
 * the cause instead of only the runtime's "Invoke Error … Unauthorized". Never logs the token,
 * email or user id.
 *   token_expired          401  normal: the app refreshes and retries (logged at INFO)
 *   missing_header         401  no Authorization header
 *   malformed_header       401  header present but not "Bearer <token>"
 *   malformed_token        403  not a parseable JWT
 *   invalid_signature      403  signature/algorithm check failed (tampered or foreign token)
 *   wrong_issuer           403  token from another user pool (e.g. other account/stage, or a replaced pool)
 *   wrong_client           403  issued to a different app client
 *   wrong_token_use        403  access token sent where the id token is expected
 *   not_yet_valid          403  nbf in the future (device clock skew)
 *   unknown_signing_key    403  kid not in the pool's JWKS
 *   jwks_unavailable       403  couldn't fetch the pool's public keys (network / Cognito)
 *   unknown                403  anything else
 */
type RejectReason =
  | 'token_expired' | 'missing_header' | 'malformed_header' | 'malformed_token' | 'invalid_signature'
  | 'wrong_issuer' | 'wrong_client' | 'wrong_token_use' | 'not_yet_valid' | 'unknown_signing_key'
  | 'jwks_unavailable' | 'unknown';

function classify(err: unknown): RejectReason {
  if (err instanceof JwtExpiredError) return 'token_expired';
  if (err instanceof JwtParseError) return 'malformed_token';
  if (err instanceof JwtInvalidSignatureError || err instanceof JwtInvalidSignatureAlgorithmError) return 'invalid_signature';
  if (err instanceof JwtInvalidIssuerError) return 'wrong_issuer';
  if (err instanceof CognitoJwtInvalidClientIdError) return 'wrong_client';
  if (err instanceof CognitoJwtInvalidTokenUseError) return 'wrong_token_use';
  if (err instanceof JwtNotBeforeError) return 'not_yet_valid';
  if (err instanceof KidNotFoundInJwksError || err instanceof JwtWithoutValidKidError) return 'unknown_signing_key';
  if (err instanceof FetchError || err instanceof JwksNotAvailableInCacheError) return 'jwks_unavailable';
  return 'unknown';
}

function logRejection(
  event: APIGatewayRequestAuthorizerEvent,
  reason: RejectReason,
  status: 401 | 403,
  err?: unknown,
): void {
  const data: Record<string, unknown> = {
    reason,
    status,
    method: event.httpMethod,
    route:  event.resource,          // route template ("/children/{id}"), no ids
    requestId: event.requestContext?.requestId,
  };
  // aws-jwt-verify's errors don't set `name` ("Error") — the class name says which check failed.
  if (err instanceof Error) data['error'] = err.constructor?.name || err.name;

  const actual = (err as FailedAssertionError | undefined)?.failedAssertion?.actual;
  if (reason === 'token_expired' && typeof actual === 'number') {
    data['expiredSecondsAgo'] = Math.round(Date.now() / 1000 - actual);
  } else if (reason === 'wrong_issuer' || reason === 'wrong_client' || reason === 'wrong_token_use') {
    data['actual'] = actual;         // the token's iss / client_id / token_use — not secret
  } else if (reason === 'unknown' || reason === 'jwks_unavailable') {
    data['message'] = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
  }

  // Expiry is the normal hourly refresh — keep WARN for things worth looking at.
  if (reason === 'token_expired') logger.info('Auth rejected', data);
  else logger.warn('Auth rejected', data);
}

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const authHeader =
    event.headers?.['Authorization'] ??
    event.headers?.['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    // Missing or malformed header → 401 (no credentials supplied)
    logRejection(event, authHeader ? 'malformed_header' : 'missing_header', 401);
    throw new Error('Unauthorized');
  }

  try {
    const payload = await getVerifier().verify(authHeader.slice(7));
    const sub     = payload.sub;
    const email   = (payload['email'] as string) ?? '';

    return {
      principalId: sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{ Action: 'execute-api:Invoke', Effect: 'Allow', Resource: wildcardArn(event.methodArn) }],
      },
      context: { sub, email },
    };
  } catch (err) {
    if (err instanceof JwtExpiredError) {
      // Expired token → 401 so the client knows to refresh
      logRejection(event, 'token_expired', 401, err);
      throw new Error('Unauthorized');
    }
    // Invalid signature, wrong issuer, etc. → 403
    logRejection(event, classify(err), 403, err);
    return deny(event.methodArn);
  }
};
