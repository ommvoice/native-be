import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
  type WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import { TABLES , getAppContext} from "../seed/config/index.js";
const APP_ENV = process.env.APP_ENV ?? "uat";
const AWS_REGION_TECHNIT = process.env.AWS_REGION_TECHNIT ?? "";
const AWS_ACCESS_KEY_ID_TECHNIT = process.env.AWS_ACCESS_KEY_ID_TECHNIT ?? "";
const AWS_SECRET_ACCESS_KEY_TECHNIT = process.env.AWS_SECRET_ACCESS_KEY_TECHNIT ?? "";
const AWS_REGION_NATIVE = process.env.AWS_REGION_NATIVE ?? "";
const AWS_ACCESS_KEY_ID_NATIVE = process.env.AWS_ACCESS_KEY_ID_NATIVE ?? "";
const AWS_SECRET_ACCESS_KEY_NATIVE = process.env.AWS_SECRET_ACCESS_KEY_NATIVE ?? "";

// Inline credentials below — do not commit real keys, fill in locally and revert before pushing.

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

const TARGET_USER_POOL_ID = "<TARGET_USER_POOL_ID>";

const SEEDED_USER_EMAIL    = "p@p.com";
const SEEDED_USER_PASSWORD = "Password123!";

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

async function seedCognitoUser(email: string, password: string, userId: string) {
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
  console.log(`Cognito user seeded — userId: ${userId}, email: ${email}, sub: ${sub}`);

  return { userId, email, sub };
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

async function main() {
  let seededUserId: string | undefined;

  for (const tableName of Object.values(TABLES)) {
    const items = await scanAll(tableName);
    console.log(`[${tableName}] found ${items.length} items`);

    if (items.length > 0) {
      await seed(tableName, items);
    }

    if (tableName === TABLES.users) {
      seededUserId = items.find((item) => item.email === SEEDED_USER_EMAIL)?.id;
    }

    console.log(`[${tableName}] migration completed`);
  }

  if (!seededUserId) {
    throw new Error(`No user with email ${SEEDED_USER_EMAIL} found in ${TABLES.users}`);
  }

  const { sub } = await seedCognitoUser(SEEDED_USER_EMAIL, SEEDED_USER_PASSWORD, seededUserId);
  await updateUserSub(seededUserId, sub);
}

main().catch(console.error);
