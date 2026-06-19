import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { JwtExpiredError } from 'aws-jwt-verify/error';
import type { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import { env } from '../../shared/config/env';

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

export const handler = async (event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const authHeader =
    event.headers?.['Authorization'] ??
    event.headers?.['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    // Missing or malformed header → 401 (no credentials supplied)
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
      throw new Error('Unauthorized');
    }
    // Invalid signature, wrong issuer, etc. → 403
    return deny(event.methodArn);
  }
};
