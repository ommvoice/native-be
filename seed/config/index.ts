/// <reference types="node" />
import "dotenv/config";
import { readFileSync } from "fs";
import { resolve }      from "path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TABLE_SUFFIXES } from "./table-suffixes.js";

// ── CDK context ────────────────────────────────────────────────────────────────

type AppContext = { appName: string; environment: string; awsProfileRegion: string; awsProfileName?: string };

export function getAppContext(env: string, cdkFileName?:string): AppContext {
  const cdkFilePath = cdkFileName ?  `cdk/${cdkFileName}` :  "cdk/cdk.json"
  const cdkJson = JSON.parse(
    readFileSync(resolve(process.cwd(), cdkFilePath), "utf-8"),
  );
  const ctx = cdkJson.context?.[env] as AppContext | undefined;
  if (!ctx) throw new Error(`No CDK context "${env}" in ${cdkFilePath} — use APP_ENV=technit or APP_ENV=native`);
  console.log(`Using CDK context "${env}":`, { appName: ctx.appName, environment: ctx.environment, region: ctx.awsProfileRegion, profile: ctx.awsProfileName });
  return ctx;
}

// APP_ENV is a cdk.json context name: "technit" (default) or "native".
const APP_ENV = process.env.APP_ENV ?? "technit";
const { appName, environment, awsProfileRegion, awsProfileName } = getAppContext(APP_ENV);
const prefix = `${appName}-${environment}`;

export { appName, environment, prefix };

// ── DynamoDB client ────────────────────────────────────────────────────────────

const client = new DynamoDBClient({
  region: awsProfileRegion ?? process.env.AWS_REGION,
  // That context's own AWS profile, so APP_ENV=native can never write to the technit account.
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
