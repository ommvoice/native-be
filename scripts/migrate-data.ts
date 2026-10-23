import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
  type WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import { TABLES , getAppContext} from "../seed/config/index.js";
const APP_ENV = process.env.APP_ENV ?? "uat";
const AWS_REGION_TECHNIT = process.env.AWS_REGION_TECHNIT ?? "";
const AWS_ACCESS_KEY_ID_TECHNIT = process.env.AWS_ACCESS_KEY_ID_TECHNIT ?? "";
const AWS_SECRET_ACCESS_KEY_TECHNIT = process.env.AWS_SECRET_ACCESS_KEY_TECHNIT ?? "";
const AWS_REGION_NATIVE = process.env.AWS_REGION_NATIVE ?? "";
const AWS_COGNITO_USER_POOL_ID_NATIVE = process.env.AWS_COGNITO_USER_POOL_ID_NATIVE ?? "";
const AWS_ACCESS_KEY_ID_NATIVE = process.env.AWS_ACCESS_KEY_ID_NATIVE ?? "";
const AWS_SECRET_ACCESS_KEY_NATIVE = process.env.AWS_SECRET_ACCESS_KEY_NATIVE ?? "";

// Inline credentials below — do not commit real keys, fill in locally and revert before pushing.

const SEEDED_USER_ID    = "efe0a4e3-a143-4d94-b72c-f39cf72e5926";  // for dbtable
const SEEDED_USER_EMAIL    = "charlotte-beveridge1@hotmail.co.uk";
const SEEDED_USER_PASSWORD = "Password123!";
const TARGET_USER_POOL_ID = AWS_COGNITO_USER_POOL_ID_NATIVE;

// ── Source account (current) ────────────────────────────────────────────────
const sourceClient = new DynamoDBClient({
  region: AWS_REGION_TECHNIT,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID_TECHNIT,
    secretAccessKey: AWS_SECRET_ACCESS_KEY_TECHNIT,
  },
});

const source = DynamoDBDocumentClient.from(sourceClient, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

// ── Target account (destination) ────────────────────────────────────────────
const targetClient = new DynamoDBClient({
  region: AWS_REGION_NATIVE,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID_NATIVE,
    secretAccessKey: AWS_SECRET_ACCESS_KEY_NATIVE,
    // sessionToken: "<TARGET_SESSION_TOKEN>",
  },
});

export const target = DynamoDBDocumentClient.from(targetClient, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

// ── Target Cognito (destination user pool) ──────────────────────────────────
const targetCognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION_NATIVE,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID_NATIVE,
    secretAccessKey: AWS_SECRET_ACCESS_KEY_NATIVE,
    // sessionToken: "<TARGET_SESSION_TOKEN>",
  },
});

async function scanAll(tableName: string) {
  const items: Record<string, any>[] = [];
  let ExclusiveStartKey: Record<string, any> | undefined;

  do {
    const result: any = await source.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
      })
    );

    items.push(...(result.Items ?? []));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}

async function seed(tableName: string, items: any[]) {
  const requests: WriteRequest[] = items.map((Item) => ({
    PutRequest: {
      Item,
    },
  }));

  for (let i = 0; i < requests.length; i += 25) {
    const batch = requests.slice(i, i + 25);

    await target.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: batch,
        },
      })
    );
  }
}


async function updateUserSub(userId: string, sub: string) {
  await target.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { id: userId },
      UpdateExpression: "SET #sub = :sub",
      ExpressionAttributeNames: { "#sub": "sub" },
      ExpressionAttributeValues: { ":sub": sub },
    }),
  );
  console.log(`[${TABLES.users}] updated sub for userId ${userId} -> ${sub}`);
}

async function runDatabaseTableMigrations() {
  for (const tableName of Object.values(TABLES)) {
    const items = await scanAll(tableName);
    console.log(`[${tableName}] found ${items.length} items`);

    if (items.length > 0) {
      await seed(tableName, items);
    }

    console.log(`[${tableName}] migration completed`);
  }
}

async function runCognitoUserMigration(email: string, password: string, userId:string) {
  const created = await targetCognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId:    TARGET_USER_POOL_ID,
      Username:      email,
      MessageAction: MessageActionType.SUPPRESS,
      TemporaryPassword: password,
    }),
  );

  await targetCognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: TARGET_USER_POOL_ID,
      Username:   email,
      Password:   password,
      Permanent:  true,
    }),
  );

  const sub = created.User?.Attributes?.find((attr) => attr.Name === "sub")?.Value;
  if (!sub) throw new Error(`Cognito did not return a sub for ${email}`);

  await updateUserSub(userId, sub) //update use sub in migrated db

  console.log(`Cognito user seeded — userId: ${userId}, email: ${email}, sub: ${sub}`);

  return { email, sub, userId };
}

// ── Single user + family migration ───────────────────────────────────────────

type Row = Record<string, any>;

function requireEnv(): void {
  const missing = Object.entries({
    AWS_REGION_TECHNIT, AWS_ACCESS_KEY_ID_TECHNIT, AWS_SECRET_ACCESS_KEY_TECHNIT,
    AWS_REGION_NATIVE, AWS_COGNITO_USER_POOL_ID_NATIVE, AWS_ACCESS_KEY_ID_NATIVE, AWS_SECRET_ACCESS_KEY_NATIVE,
  }).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing env vars in .env: ${missing.join(", ")}`);
}

/** Every item in a source-table GSI for one key, paged. */
async function querySourceByIndex(tableName: string, indexName: string, field: string, value: string): Promise<Row[]> {
  const items: Row[] = [];
  let ExclusiveStartKey: Row | undefined;
  do {
    const res = await source.send(new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: "#f = :v",
      ExpressionAttributeNames: { "#f": field },
      ExpressionAttributeValues: { ":v": value },
      ExclusiveStartKey,
    }));
    items.push(...((res.Items ?? []) as Row[]));
    ExclusiveStartKey = res.LastEvaluatedKey as Row | undefined;
  } while (ExclusiveStartKey);
  return items;
}

/** Batch-puts rows into the target table, retrying UnprocessedItems (throttling) until all are written. */
async function putTarget(tableName: string, rows: Row[]): Promise<void> {
  for (let i = 0; i < rows.length; i += 25) {
    let pending: any = { [tableName]: rows.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })) };
    for (let attempt = 0; pending && Object.keys(pending).length; attempt++) {
      if (attempt > 8) throw new Error(`[${tableName}] gave up after repeated UnprocessedItems`);
      if (attempt) await new Promise((r) => setTimeout(r, 2 ** attempt * 100));
      const res = await target.send(new BatchWriteCommand({ RequestItems: pending }));
      pending = res.UnprocessedItems;
    }
  }
}

/** Creates the Cognito user in the target pool with email_verified=true (so forgot-password works) —
 * or, if it already exists from an earlier run, reuses it and makes sure email_verified is set.
 * Returns the target-pool `sub`. */
async function ensureTargetCognitoUser(email: string, password?: string): Promise<string> {
  let sub: string | undefined;
  try {
    const created = await targetCognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: TARGET_USER_POOL_ID,
      Username: email,
      MessageAction: MessageActionType.SUPPRESS,
      ...(password ? { TemporaryPassword: password } : {}),
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
    }));
    sub = created.User?.Attributes?.find((a) => a.Name === "sub")?.Value;
    console.log(`  cognito: created ${email}`);
  } catch (err: any) {
    if (err?.name !== "UsernameExistsException") throw err;
    const existing = await targetCognitoClient.send(new AdminGetUserCommand({ UserPoolId: TARGET_USER_POOL_ID, Username: email }));
    sub = existing.UserAttributes?.find((a) => a.Name === "sub")?.Value;
    await targetCognitoClient.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: TARGET_USER_POOL_ID,
      Username: email,
      UserAttributes: [{ Name: "email_verified", Value: "true" }],
    }));
    console.log(`  cognito: ${email} already exists — reused it, email_verified set to true`);
  }
  if (password) {
    await targetCognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: TARGET_USER_POOL_ID, Username: email, Password: password, Permanent: true,
    }));
    console.log("  cognito: password set (permanent)");
  }
  if (!sub) throw new Error(`Cognito did not return a sub for ${email}`);
  return sub;
}

/**
 * Copies ONE account from the source (Technit) to the target (Native) account:
 * Cognito login (email_verified=true) + its users row (with the new target `sub`) + parent + children
 * + the parent's wishlists (with items), visit intentions and opportunity interactions.
 * Ids are kept as-is, so every link (parent.userId, child.parentId, wishlist.parentId, …) still resolves.
 * Driving legs are a recomputable distance cache and are not copied.
 *
 * Dry run unless `apply` is true. Safe to re-run: the Cognito user is reused and rows are overwritten by id.
 * Without a password the user has no usable password in the target pool — use "Forgotten password" in the
 * app (works because email_verified=true) or pass one.
 */
async function runCognitoUserMigrationWithChildren(userId: string, opts: { password?: string; apply?: boolean } = {}) {
  requireEnv();
  const apply = !!opts.apply;
  console.log(`\n${apply ? "MIGRATING" : "DRY RUN — nothing will be written"}: user ${userId}`);

  const user = (await source.send(new GetCommand({ TableName: TABLES.users, Key: { id: userId } }))).Item as Row | undefined;
  if (!user) throw new Error(`User ${userId} not found in source ${TABLES.users}`);
  if (!user.email) throw new Error(`User ${userId} has no email`);

  const parents = await querySourceByIndex(TABLES.parents, "userId-index", "userId", userId);
  if (parents.length > 1) console.warn(`  ! ${parents.length} parent rows for this user — copying all`);

  const family: Record<string, Row[]> = { children: [], wishlists: [], wishlistItems: [], visitIntentions: [], opportunityInteractions: [] };
  for (const parent of parents) {
    const [children, wishlists, visitIntentions, opportunityInteractions] = await Promise.all([
      querySourceByIndex(TABLES.children, "parentId-index", "parentId", parent.id),
      querySourceByIndex(TABLES.wishlists, "parentId-index", "parentId", parent.id),
      querySourceByIndex(TABLES.visitIntentions, "parentId-index", "parentId", parent.id),
      querySourceByIndex(TABLES.opportunityInteractions, "parentId-index", "parentId", parent.id),
    ]);
    family.children.push(...children);
    family.wishlists.push(...wishlists);
    family.visitIntentions.push(...visitIntentions);
    family.opportunityInteractions.push(...opportunityInteractions);
    for (const w of wishlists) {
      family.wishlistItems.push(...(await querySourceByIndex(TABLES.wishlistItems, "wishlistId-index", "wishlistId", w.id)));
    }
  }

  console.log(`  source user: ${user.email} (role ${user.role ?? "?"}, sub ${user.sub})`);
  console.log(`  parent: ${parents.map((p) => `${p.firstNameOrNickName ?? "?"} (${p.id})`).join(", ") || "none"}`);
  console.log(`  children: ${family.children.map((c) => `${c.nameOrNickName ?? "?"}${c.variant === "guest" ? " [guest]" : ""}`).join(", ") || "none"}`);
  for (const [k, rows] of Object.entries(family)) if (k !== "children") console.log(`  ${k}: ${rows.length}`);

  if (!apply) {
    console.log("\nDry run complete — re-run with --apply to write.");
    return { email: user.email as string, userId, applied: false };
  }

  const sub = await ensureTargetCognitoUser(user.email, opts.password);

  // Whole row with the target sub swapped in — never a partial row.
  await putTarget(TABLES.users, [{ ...user, sub }]);
  await putTarget(TABLES.parents, parents);
  await putTarget(TABLES.children, family.children);
  await putTarget(TABLES.wishlists, family.wishlists);
  await putTarget(TABLES.wishlistItems, family.wishlistItems);
  await putTarget(TABLES.visitIntentions, family.visitIntentions);
  await putTarget(TABLES.opportunityInteractions, family.opportunityInteractions);

  console.log(`\nMigrated ${user.email}: target sub ${sub} — 1 user, ${parents.length} parent, ` +
    Object.entries(family).map(([k, rows]) => `${rows.length} ${k}`).join(", "));
  return { email: user.email as string, userId, sub, applied: true };
}

/** Source users-table id for an email (users table has an email-index GSI). Tries the exact text, then lowercase. */
async function findSourceUserIdByEmail(email: string): Promise<string> {
  for (const candidate of [...new Set([email.trim(), email.trim().toLowerCase()])]) {
    const rows = await querySourceByIndex(TABLES.users, "email-index", "email", candidate);
    if (rows.length > 1) throw new Error(`${rows.length} users share the email ${candidate}: ${rows.map((r) => r.id).join(", ")}`);
    if (rows.length === 1) return rows[0].id as string;
  }
  throw new Error(`No user with email ${email} in source ${TABLES.users}`);
}

/** CLI: npm run migrate:data -- (--user-id <id> | --email <email>) [--password <pw>] [--apply] */
function cliArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {

  // await runDatabaseTableMigrations()
  // await runCognitoUserMigration(SEEDED_USER_EMAIL, SEEDED_USER_PASSWORD,SEEDED_USER_ID);

  const email = cliArg("--email");
  const userId = cliArg("--user-id") ?? (email ? await findSourceUserIdByEmail(email) : SEEDED_USER_ID);
  await runCognitoUserMigrationWithChildren(userId, {
    password: cliArg("--password"),
    apply: process.argv.includes("--apply"),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
