import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
  type WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import { TABLES } from "../seed/config/index.js";

// Inline credentials below — do not commit real keys, fill in locally and revert before pushing.

// ── Source account (current) ────────────────────────────────────────────────
const sourceClient = new DynamoDBClient({
  region: "eu-west-3",
  credentials: {
    accessKeyId: "<SOURCE_ACCESS_KEY_ID>",
    secretAccessKey: "<SOURCE_SECRET_ACCESS_KEY>",
    // sessionToken: "<SOURCE_SESSION_TOKEN>",
  },
});

const source = DynamoDBDocumentClient.from(sourceClient, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

// ── Target account (destination) ────────────────────────────────────────────
const targetClient = new DynamoDBClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: "<TARGET_ACCESS_KEY_ID>",
    secretAccessKey: "<TARGET_SECRET_ACCESS_KEY>",
    // sessionToken: "<TARGET_SESSION_TOKEN>",
  },
});

export const target = DynamoDBDocumentClient.from(targetClient, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

// ── Target Cognito (destination user pool) ──────────────────────────────────
const targetCognitoClient = new CognitoIdentityProviderClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: "<TARGET_ACCESS_KEY_ID>",
    secretAccessKey: "<TARGET_SECRET_ACCESS_KEY>",
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
  console.log(`Cognito user seeded — userId: ${userId}, email: ${email}, sub: ${sub}`);

  return { userId, email, sub };
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

  await seedCognitoUser(SEEDED_USER_EMAIL, SEEDED_USER_PASSWORD, seededUserId);
}

main().catch(console.error);
