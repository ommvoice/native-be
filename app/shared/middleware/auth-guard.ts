import type { APIGatewayProxyEvent } from 'aws-lambda';

/** Claims injected by the API Gateway RequestAuthorizer into requestContext.authorizer. */
export interface AuthUser {
  sub:   string;
  email: string;
}

/** Helper to read the authorizer context from a proxied event. */
export function getAuthUser(event: APIGatewayProxyEvent): AuthUser {
  const ctx = event.requestContext.authorizer as Record<string, string> | undefined;
  return {
    sub:   ctx?.['sub']   ?? '',
    email: ctx?.['email'] ?? '',
  };
}
