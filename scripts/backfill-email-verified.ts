/// <reference types="node" />
/**
 * One-time backfill: marks email_verified=true on every Cognito user that doesn't have it.
 *
 * Accounts created before signup started setting email_verified (AuthService.register) can't use
 * the forgot-password flow — Cognito only sends reset codes to a verified email. New signups
 * already get it, so this only needs running once per environment (it's idempotent anyway).
 *
 * Usage:
 *   APP_ENV=uat npx tsx scripts/backfill-email-verified.ts --dry-run   # list who'd be updated
 *   APP_ENV=uat npx tsx scripts/backfill-email-verified.ts             # apply
 *
 * Runs with your local AWS credentials (e.g. AWS_PROFILE=cdk_profile_fo9). The user pool is
 * resolved by name ({appName}-{env}-user-pool), the same name CognitoStack gives it.
 */
import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  ListUsersCommand,
  type UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { getAppContext, prefix } from "../seed/config/index.js";

const dryRun = process.argv.includes("--dry-run");
const { awsProfileRegion } = getAppContext(process.env.APP_ENV ?? "dev");
const cognito = new CognitoIdentityProviderClient({ region: awsProfileRegion });

async function findUserPoolId(name: string): Promise<string> {
  let nextToken: string | undefined;
  do {
    const res = await cognito.send(new ListUserPoolsCommand({ MaxResults: 60, NextToken: nextToken }));
    const match = res.UserPools?.find((p) => p.Name === name);
    if (match?.Id) return match.Id;
    nextToken = res.NextToken;
  } while (nextToken);
  throw new Error(`User pool "${name}" not found in ${awsProfileRegion}`);
}

async function listAllUsers(userPoolId: string): Promise<UserType[]> {
  const users: UserType[] = [];
  let paginationToken: string | undefined;
  do {
    const res = await cognito.send(new ListUsersCommand({ UserPoolId: userPoolId, PaginationToken: paginationToken }));
    users.push(...(res.Users ?? []));
    paginationToken = res.PaginationToken;
  } while (paginationToken);
  return users;
}

const attr = (user: UserType, name: string) => user.Attributes?.find((a) => a.Name === name)?.Value;

async function main(): Promise<void> {
  const poolName = `${prefix}-user-pool`;
  const userPoolId = await findUserPoolId(poolName);
  const users = await listAllUsers(userPoolId);
  const pending = users.filter((u) => attr(u, "email_verified") !== "true");

  console.log(`${poolName} (${userPoolId}): ${users.length} users, ${pending.length} without email_verified${dryRun ? " [dry run]" : ""}`);

  for (const user of pending) {
    console.log(`  ${dryRun ? "would update" : "updating"} ${attr(user, "email") ?? user.Username}`);
    if (dryRun) continue;
    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: user.Username!,
        UserAttributes: [{ Name: "email_verified", Value: "true" }],
      }),
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
