/// <reference types="node" />
import "dotenv/config";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TABLE_SUFFIXES } from "./table-suffixes.js";
import { DEFAULT_TARGET, resolveCdkTarget } from "./cdk-target.js";

// ── CDK context ────────────────────────────────────────────────────────────────

type AppContext = { appName: string; environment: string; awsProfileRegion: string; awsProfileName?: string };

/** `env` is a deploy target "<account>:<stage>" (e.g. "native:uat"); see cdk-target.ts. */
export function getAppContext(env: string, cdkFileName?: string): AppContext {
  const ctx = resolveCdkTarget(env, cdkFileName);
  console.log(`Using CDK context "${ctx.target}":`, { appName: ctx.appName, environment: ctx.environment, region: ctx.awsProfileRegion, profile: ctx.awsProfileName });
  return ctx;
}

// APP_ENV is a deploy target "<account>:<stage>" — technit:uat (default), technit:prod, native:uat, native:prod.
// A bare account ("technit") means its uat stage.
const APP_ENV = process.env.APP_ENV ?? DEFAULT_TARGET;
const { appName, environment, awsProfileRegion, awsProfileName } = getAppContext(APP_ENV);
const prefix = `${appName}-${environment}`;

export { appName, environment, prefix };

// ── DynamoDB client ────────────────────────────────────────────────────────────

const client = new DynamoDBClient({
  region: awsProfileRegion ?? process.env.AWS_REGION,
  // That context's own AWS profile, so APP_ENV=native:uat can never write to the technit account.
  // Set AWS_PROFILE yourself to override (e.g. CI without a ~/.aws profile file).
  ...(awsProfileName && !process.env.AWS_PROFILE ? { profile: awsProfileName } : {}),
});

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

export default db;

export const TABLES = Object.fromEntries(
  Object.entries(TABLE_SUFFIXES).map(([key, suffix]) => [key, `${prefix}-${suffix}`]),
) as { [K in keyof typeof TABLE_SUFFIXES]: string };

// ── Shared types ───────────────────────────────────────────────────────────────

export type OpportunityRecordType = "venue" | "event" | "club" | "route";
export type FacilityType          = "GENERAL" | "PARENT" | "KID" | "DOG";
