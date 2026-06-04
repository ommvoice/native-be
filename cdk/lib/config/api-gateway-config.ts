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

export const API_STAGE_OPTIONS: apigateway.StageOptions = {
  dataTraceEnabled: false,   // do not log full request/response bodies (security + cost)
  metricsEnabled:   true,    // CloudWatch metrics per route
  tracingEnabled:   true,    // AWS X-Ray tracing
};

// ── Lambda integration defaults ────────────────────────────────────────────────

export const LAMBDA_INTEGRATION_OPTIONS: apigateway.LambdaIntegrationOptions = {
  proxy: true,    // full proxy — Lambda controls status code and headers
};
