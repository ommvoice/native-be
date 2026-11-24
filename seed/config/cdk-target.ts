/// <reference types="node" />
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Resolves a deploy target ("<account>:<stage>", e.g. "technit:uat") to its cdk/cdk.json block.
 * cdk.json context is grouped by AWS account, then stage:
 *   { "technit": { "uat": {...}, "prod": {...} }, "native": { "uat": {...}, "prod": {...} } }
 * Same rules as cdk/lib/utils/index.ts: a bare account ("technit") means its "uat" stage, and a
 * block's `environment` (the resource-name segment) defaults to the stage key. No side effects.
 */
export type CdkTargetContext = {
  appName: string;
  environment: string;
  awsProfileRegion: string;
  awsProfileName?: string;
  thirdPartySecretName?: string;
  [key: string]: unknown;
};

export const DEFAULT_TARGET = "technit:uat";
const DEFAULT_STAGE = "uat";

export function parseTarget(raw: string): { account: string; stage: string; target: string } {
  const [account = "", stage = DEFAULT_STAGE, ...rest] = raw.trim().split(":");
  if (!account || rest.length) throw new Error(`Bad target "${raw}" — use <account>:<stage>, e.g. ${DEFAULT_TARGET}`);
  return { account, stage, target: `${account}:${stage}` };
}

export function resolveCdkTarget(raw: string, cdkFileName = "cdk.json"): CdkTargetContext & { account: string; stage: string; target: string } {
  const { account, stage, target } = parseTarget(raw);
  const cdkFilePath = `cdk/${cdkFileName}`;
  const cdkJson = JSON.parse(readFileSync(resolve(process.cwd(), cdkFilePath), "utf-8"));
  const block = cdkJson.context?.[account]?.[stage] as CdkTargetContext | undefined;
  if (!block || typeof block !== "object") {
    const accounts = Object.keys(cdkJson.context ?? {}).filter((k) => !k.startsWith("@") && typeof cdkJson.context[k] === "object");
    // A bare stage ("uat") names no account — it's the old .env APP_ENV value, ambiguous across accounts.
    const hint = accounts.some((a) => cdkJson.context[a]?.[account])
      ? ` "${account}" is a stage, not an account — use ${accounts.map((a) => `${a}:${account}`).join(" or ")} (check APP_ENV in .env)`
      : ` use APP_ENV=<account>:<stage>, e.g. ${DEFAULT_TARGET}`;
    throw new Error(`No CDK context "${target}" in ${cdkFilePath} —${hint}`);
  }
  return { ...block, environment: block.environment ?? stage, account, stage, target };
}
