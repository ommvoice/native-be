import "dotenv/config";
import { DeleteTableCommand, DynamoDBClient, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

const PREFIX = process.env.DYNAMODB_TABLE_PREFIX ?? "native-be";

const TABLE_NAMES = [
  `${PREFIX}-users`,
  `${PREFIX}-parents`,
  `${PREFIX}-children`,
  `${PREFIX}-interest-categories`,
  `${PREFIX}-interest-sub-categories`,
  `${PREFIX}-skills`,
  `${PREFIX}-skill-levels`,
  `${PREFIX}-facilities`,
  `${PREFIX}-opportunity-venues`,
  `${PREFIX}-opportunity-events`,
  `${PREFIX}-opportunity-clubs`,
  `${PREFIX}-opportunity-routes`,
  `${PREFIX}-driving-legs`,
  `${PREFIX}-wishlists`,
  `${PREFIX}-wishlist-items`,
];

async function deleteTable(name: string) {
  try {
    await client.send(new DeleteTableCommand({ TableName: name }));
    console.log(`  🗑  Deleted: ${name}`);
  } catch (err) {
    if (err instanceof ResourceNotFoundException) {
      console.log(`  ⏭  Not found (skipped): ${name}`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log(`\nDestroying DynamoDB tables (prefix: ${PREFIX})\n`);
  for (const name of TABLE_NAMES) {
    await deleteTable(name);
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
