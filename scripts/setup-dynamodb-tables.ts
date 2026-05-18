import "dotenv/config";
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

const PREFIX = process.env.DYNAMODB_TABLE_PREFIX ?? "native-be";

type TableDef = {
  name: string;
  pk: string;
  sk?: string;
  gsis?: {
    name: string;
    pk: string;
    pkType?: "S" | "N";
    projection?: "ALL" | "KEYS_ONLY";
  }[];
};

const TABLES: TableDef[] = [
  {
    name: `${PREFIX}-users`,
    pk: "id",
    gsis: [
      { name: "email-index", pk: "email" },
      { name: "sub-index", pk: "sub" },
    ],
  },
  {
    name: `${PREFIX}-parents`,
    pk: "id",
    gsis: [{ name: "userId-index", pk: "userId" }],
  },
  {
    name: `${PREFIX}-children`,
    pk: "id",
    gsis: [{ name: "parentId-index", pk: "parentId" }],
  },
  {
    name: `${PREFIX}-interest-categories`,
    pk: "id",
    gsis: [{ name: "slug-index", pk: "slug" }],
  },
  {
    name: `${PREFIX}-interest-sub-categories`,
    pk: "id",
    gsis: [{ name: "categoryId-index", pk: "categoryId" }],
  },
  {
    name: `${PREFIX}-skills`,
    pk: "id",
    gsis: [{ name: "type-index", pk: "type" }],
  },
  {
    name: `${PREFIX}-skill-levels`,
    pk: "id",
  },
  {
    name: `${PREFIX}-facilities`,
    pk: "id",
    gsis: [{ name: "type-index", pk: "type" }],
  },
  { name: `${PREFIX}-opportunity-venues`, pk: "id" },
  { name: `${PREFIX}-opportunity-events`, pk: "id" },
  { name: `${PREFIX}-opportunity-clubs`, pk: "id" },
  { name: `${PREFIX}-opportunity-routes`, pk: "id" },
  {
    name: `${PREFIX}-driving-legs`,
    pk: "parentId",
    sk: "typeId",
  },
  {
    name: `${PREFIX}-wishlists`,
    pk: "id",
    gsis: [{ name: "parentId-index", pk: "parentId" }],
  },
  {
    name: `${PREFIX}-wishlist-items`,
    pk: "id",
    gsis: [{ name: "wishlistId-index", pk: "wishlistId" }],
  },
];

async function tableExists(name: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: name }));
    return true;
  } catch {
    return false;
  }
}

async function createTable(def: TableDef) {
  const attrDefs: { AttributeName: string; AttributeType: "S" | "N" }[] = [
    { AttributeName: def.pk, AttributeType: "S" },
  ];
  const keySchema: { AttributeName: string; KeyType: "HASH" | "RANGE" }[] = [
    { AttributeName: def.pk, KeyType: "HASH" },
  ];

  if (def.sk) {
    attrDefs.push({ AttributeName: def.sk, AttributeType: "S" });
    keySchema.push({ AttributeName: def.sk, KeyType: "RANGE" });
  }

  const gsiDefs = (def.gsis ?? []).map((gsi) => {
    const pkType = gsi.pkType ?? "S";
    if (!attrDefs.find((a) => a.AttributeName === gsi.pk)) {
      attrDefs.push({ AttributeName: gsi.pk, AttributeType: pkType });
    }
    return {
      IndexName: gsi.name,
      KeySchema: [{ AttributeName: gsi.pk, KeyType: "HASH" as const }],
      Projection: { ProjectionType: (gsi.projection ?? "ALL") as "ALL" | "KEYS_ONLY" | "INCLUDE" },
      BillingMode: undefined,
    };
  });

  try {
    await client.send(
      new CreateTableCommand({
        TableName: def.name,
        AttributeDefinitions: attrDefs,
        KeySchema: keySchema,
        BillingMode: "PAY_PER_REQUEST",
        ...(gsiDefs.length > 0 ? { GlobalSecondaryIndexes: gsiDefs } : {}),
      }),
    );
    console.log(`  ✅ Created: ${def.name}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`  ⏭  Already exists: ${def.name}`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log(`\nSetting up DynamoDB tables (prefix: ${PREFIX})\n`);
  for (const def of TABLES) {
    const exists = await tableExists(def.name);
    if (exists) {
      console.log(`  ⏭  Already exists: ${def.name}`);
    } else {
      await createTable(def);
    }
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
