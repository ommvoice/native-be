import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'eu-west-2',
});

/** Singleton DynamoDB Document client — reused across warm Lambda invocations. */
export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

export default db;
