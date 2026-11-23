import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// ── CORS ───────────────────────────────────────────────────────────────────────

export const API_CORS_HEADERS: string[] = [
  'Content-Type',
  'Authorization',
  'X-Amz-Date',
  'X-Api-Key',
  'X-Amz-Security-Token',
];

export const API_CORS_OPTIONS: apigateway.CorsOptions = {
  allowOrigins: apigateway.Cors.ALL_ORIGINS,
  allowMethods: apigateway.Cors.ALL_METHODS,
  allowHeaders: API_CORS_HEADERS,
};

// ── Stage options ──────────────────────────────────────────────────────────────

/** Stricter limits for unauthenticated, abuse-prone routes (credential stuffing, mass sign-up,
 * reset-code guessing). Keyed `/<path>/<METHOD>` as API Gateway method settings expect. */
const AUTH_ROUTE_THROTTLE: apigateway.ThrottleSettings = { rateLimit: 10, burstLimit: 20 };
const AUTH_THROTTLED_METHODS = [
  '/auth/login/POST',
  '/auth/register/POST',
  '/auth/refresh/POST',
  '/auth/logout/POST',
  '/auth/forgot-password/POST',
  '/auth/reset-password/POST',
  '/onboard-parents/POST',
];

export const API_STAGE_OPTIONS: apigateway.StageOptions = {
  dataTraceEnabled: false,   // do not log full request/response bodies (security + cost)
  metricsEnabled:   true,    // CloudWatch metrics per route
  tracingEnabled:   true,    // AWS X-Ray tracing
  // Stage-wide ceiling (all clients combined) — caps runaway cost / denial-of-wallet. Per-client
  // (per-IP) limits are enforced by the WAF rate-based rules in ApiStack.
  throttlingRateLimit:  50,
  throttlingBurstLimit: 100,
  methodOptions: Object.fromEntries(
    AUTH_THROTTLED_METHODS.map((m) => [m, {
      throttlingRateLimit:  AUTH_ROUTE_THROTTLE.rateLimit!,
      throttlingBurstLimit: AUTH_ROUTE_THROTTLE.burstLimit!,
    }]),
  ),
};

// ── WAF ────────────────────────────────────────────────────────────────────────

/** Requests per IP per 5 minutes before the WAF blocks that IP (AWS minimum is 10). */
export const WAF_RATE_LIMIT_ALL  = 2000;
export const WAF_RATE_LIMIT_AUTH = 100;

// ── Lambda integration defaults ────────────────────────────────────────────────

export const LAMBDA_INTEGRATION_OPTIONS: apigateway.LambdaIntegrationOptions = {
  proxy: true,    // full proxy — Lambda controls status code and headers
};
