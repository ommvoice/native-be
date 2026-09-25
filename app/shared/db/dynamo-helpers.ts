import { BatchGetCommand, BatchWriteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import db from './dynamo-client';

const BATCH_GET_MAX = 100;
const BATCH_WRITE_MAX = 25;

/** BatchGet up to N items from a single table, chunking at 100 per request. */
export async function batchGetItems(
  tableName: string,
  ids: string[],
  pkField = 'id',
): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];

  const unique  = [...new Set(ids)];
  const results: Record<string, unknown>[] = [];

  for (let i = 0; i < unique.length; i += BATCH_GET_MAX) {
    const chunk = unique.slice(i, i + BATCH_GET_MAX);
    const res   = await db.send(
      new BatchGetCommand({
        RequestItems: {
          [tableName]: { Keys: chunk.map((id) => ({ [pkField]: id })) },
        },
      }),
    );
    const items = (res.Responses?.[tableName] ?? []) as Record<string, unknown>[];
    results.push(...items);
  }

  return results;
}

/** Full table scan with pagination — intended for small lookup tables only. */
export async function scanAll(tableName: string): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const res = await db.send(
      new ScanCommand({
        TableName: tableName,
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    results.push(...((res.Items ?? []) as Record<string, unknown>[]));
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return results;
}

/** Query every item on a GSI for one partition value, following pagination. */
export async function queryAllByIndex(
  tableName: string,
  indexName: string,
  keyField: string,
  keyValue: string,
): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const res = await db.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#k = :v',
        ExpressionAttributeNames: { '#k': keyField },
        ExpressionAttributeValues: { ':v': keyValue },
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    results.push(...((res.Items ?? []) as Record<string, unknown>[]));
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return results;
}

/** BatchDelete by primary key, chunking at 25 per request and retrying unprocessed items. */
export async function batchDeleteItems(tableName: string, ids: string[], pkField = 'id'): Promise<void> {
  const unique = [...new Set(ids)];

  for (let i = 0; i < unique.length; i += BATCH_WRITE_MAX) {
    let requests: Record<string, unknown>[] | undefined = unique
      .slice(i, i + BATCH_WRITE_MAX)
      .map((id) => ({ DeleteRequest: { Key: { [pkField]: id } } }));

    for (let attempt = 0; requests && requests.length > 0; attempt++) {
      if (attempt >= 5) throw new Error(`batchDeleteItems: ${requests.length} unprocessed items on ${tableName}`);
      if (attempt > 0) await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
      const res = await db.send(new BatchWriteCommand({ RequestItems: { [tableName]: requests as never } }));
      requests = res.UnprocessedItems?.[tableName] as Record<string, unknown>[] | undefined;
    }
  }
}
