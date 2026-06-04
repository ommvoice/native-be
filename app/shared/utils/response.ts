import type { APIGatewayProxyResult } from 'aws-lambda';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

function json(statusCode: number, body: unknown): APIGatewayProxyResult {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export const ok      = <T>(data: T)         => json(200, data);
export const created = <T>(data: T)         => json(201, data);
export const noContent = ()                 => ({ statusCode: 204, headers: JSON_HEADERS, body: '' });

export function errorResponse(statusCode: number, message: string, details?: unknown): APIGatewayProxyResult {
  return json(statusCode, { error: message, ...(details ? { details } : {}) });
}
