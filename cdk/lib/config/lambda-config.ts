import * as lambda from 'aws-cdk-lib/aws-lambda';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';

// ── Runtime ────────────────────────────────────────────────────────────────────

export const LAMBDA_RUNTIME       = lambda.Runtime.NODEJS_22_X;
export const LAMBDA_ARCHITECTURE  = lambda.Architecture.ARM_64;

// ── Defaults applied to every function ────────────────────────────────────────

export const LAMBDA_DEFAULTS = {
  memoryMb:      512,
  timeoutSeconds: 15,
} as const;

// ── Layer bundling ─────────────────────────────────────────────────────────────

export const LAYER_BUNDLING = {
  /** Same image version as the Lambda runtime for identical native binaries. */
  image:   LAMBDA_RUNTIME.bundlingImage,
  /**
   * --cache /tmp/.npm avoids EACCES when Docker runs as a non-root uid (e.g. 503:20 on macOS).
   * The container's /.npm is root-owned; /tmp is always writable.
   */
  command: [
    'bash',
    '-c',
    'npm ci --omit=dev --cache /tmp/.npm && mkdir -p /asset-output/nodejs && cp -rT node_modules /asset-output/nodejs/node_modules',
  ] as string[],
};

/**
 * Every package listed here is excluded from individual Lambda bundles by esbuild.
 * They are resolved at runtime from the shared Lambda layer (/opt/nodejs/node_modules).
 * Add any third-party import here — the Lambda zip should contain ONLY application code.
 */
export const LAYER_EXTERNAL_MODULES: string[] = [
  // ── AWS SDK (DynamoDB + Cognito) ──────────────────────────────────────────
  '@aws-sdk/client-cognito-identity-provider',
  '@aws-sdk/client-dynamodb',
  '@aws-sdk/lib-dynamodb',
  '@smithy/*',          // AWS SDK internal utilities (transitive deps)

  // ── Middy middleware ──────────────────────────────────────────────────────
  '@middy/core',
  '@middy/http-json-body-parser',
  '@middy/http-error-handler',
  '@middy/http-cors',

  // ── Auth / validation / utilities ────────────────────────────────────────
  'aws-jwt-verify',
  'http-errors',
  'http-status-codes',
  'node-fetch',
  'uuid',
  'yup',
];


// ── esbuild bundling options (env-aware) ──────────────────────────────────────

/**
 * Returns esbuild bundling options for Lambda functions.
 *
 * format: ESM  — required because middy v7 (and AWS SDK v3) ship ESM-only packages.
 *                CJS require() fails with "No exports main defined" against them.
 *                Node.js 22 Lambda has full ESM support.
 *
 * prod   → minified, no source map  (optimised cold start, smaller zip)
 * other  → NOT minified, inline source map  (readable in Lambda console, debuggable)
 *
 * All layer packages are marked external — esbuild emits `import '...'` statements
 * that resolve from /opt/nodejs/node_modules at runtime.
 */
export function getBundlingOptions(appEnv: string) {
  const isProd = appEnv === 'prod';
  return {
    format:          OutputFormat.ESM,
    minify:          isProd,
    sourceMap:       !isProd,
    sourcesContent:  !isProd,
    target:          'es2022',
    externalModules: LAYER_EXTERNAL_MODULES,
  };
}

// ── CloudWatch log retention ───────────────────────────────────────────────────

export const LOG_RETENTION_DAYS: Record<string, number> = {
  prod: 30,
  default: 7,
};

export function logRetentionDays(env: string): number {
  return LOG_RETENTION_DAYS[env] ?? LOG_RETENTION_DAYS['default']!;
}

