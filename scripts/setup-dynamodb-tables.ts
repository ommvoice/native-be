import "dotenv/config";
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from "@aws-sdk/client-dynamodb";
import { TABLES } from "../api/database/tables.js";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

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

const TABLE_DEFS: TableDef[] = [
  {
    name: TABLES.users,
    pk: "id",
    gsis: [
      { name: "email-index", pk: "email" },
      { name: "sub-index", pk: "sub" },
    ],
  },
  {
    name: TABLES.parents,
    pk: "id",
    gsis: [{ name: "userId-index", pk: "userId" }],
  },
  {
    name: TABLES.children,
    pk: "id",
    gsis: [{ name: "parentId-index", pk: "parentId" }],
  },
  {
    name: TABLES.interestCategories,
    pk: "id",
    gsis: [{ name: "slug-index", pk: "slug" }],
  },
  {
    name: TABLES.interestSubCategories,
    pk: "id",
    gsis: [{ name: "categoryId-index", pk: "categoryId" }],
  },
  {
    name: TABLES.skills,
    pk: "id",
    gsis: [{ name: "type-index", pk: "type" }],
  },
  {
    name: TABLES.skillLevels,
    pk: "id",
  },
  {
    name: TABLES.facilities,
    pk: "id",
    gsis: [{ name: "type-index", pk: "type" }],
  },
  { name: TABLES.opportunityVenues, pk: "id" },
  { name: TABLES.opportunityEvents, pk: "id" },
  { name: TABLES.opportunityClubs, pk: "id" },
  { name: TABLES.opportunityRoutes, pk: "id" },
  { name: TABLES.opportunityClubsV2, pk: "id" },
  { name: TABLES.opportunityEventsV2, pk: "id" },
  { name: TABLES.opportunityVenuesV2, pk: "id" },
  { name: TABLES.opportunityRoutesV2, pk: "id" },
  {
    name: TABLES.opportunityThemes,
    pk: "id",
    gsis: [
      { name: "recordType-index", pk: "recordType" },
      { name: "slug-index", pk: "slug" },
    ],
  },
  {
    name: TABLES.opportunityThemeVariants,
    pk: "id",
    gsis: [
      { name: "themeId-index", pk: "themeId" },
      { name: "slug-index", pk: "slug" },
    ],
  },
  {
    name: TABLES.drivingLegs,
    pk: "parentId",
    sk: "typeId",
  },
  {
    name: TABLES.wishlists,
    pk: "id",
    gsis: [{ name: "parentId-index", pk: "parentId" }],
  },
  {
    name: TABLES.wishlistItems,
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
  console.log(`\nSetting up DynamoDB tables\n`);
  for (const def of TABLE_DEFS) {
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
