import "dotenv/config";
import { DeleteTableCommand, DynamoDBClient, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
import { TABLES } from "../api/database/tables.js";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {}),
});

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
  const tableNames = Object.values(TABLES);
  console.log(`\nDestroying DynamoDB tables\n`);
  for (const name of tableNames) {
    await deleteTable(name);
  }
  console.log("\nDone.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
