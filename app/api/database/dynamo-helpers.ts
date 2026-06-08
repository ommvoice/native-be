import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import db from "./database.config.js";

const BATCH_GET_MAX = 100;

/**
 * BatchGet up to N items from a single table, chunking at 100 items per request.
 * Returns raw DynamoDB items (plain objects).
 */
export async function batchGetItems(
  tableName: string,
  ids: string[],
  pkField = "id",
): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];

  const unique = [...new Set(ids)];
  const results: Record<string, unknown>[] = [];

  for (let i = 0; i < unique.length; i += BATCH_GET_MAX) {
    const chunk = unique.slice(i, i + BATCH_GET_MAX);
    const res = await db.send(
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

/** Scan all items from a table (no filter). For tables that stay small (lookup tables). */
export async function scanAll(tableName: string): Promise<Record<string, unknown>[]> {
  const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
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
