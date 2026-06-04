import type { APIGatewayProxyResult } from 'aws-lambda';
import type { MiddlewareObj } from '@middy/core';
import { AppError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

export function errorHandler(): MiddlewareObj {
  return {
    onError: async (request): Promise<void> => {
      const err = request.error as unknown;

      // Structured error log (visible in Lambda's dedicated CloudWatch log group)
      logger.error('Unhandled Lambda error', {
        name:       (err as Error)?.name,
        message:    (err as Error)?.message,
        stack:      (err as Error)?.stack,
        path:       request.event?.path,
        httpMethod: request.event?.httpMethod,
      });

      let response: APIGatewayProxyResult;

      if (err instanceof AppError) {
        response = errorResponse(err.statusCode, err.message);
      } else if (isValidationError(err)) {
        response = errorResponse(422, 'Validation failed', (err as { errors: string[] }).errors);
      } else {
        response = errorResponse(500, 'An unexpected error occurred');
      }

      request.response = response;
    },
  };
}

function isValidationError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'ValidationError'
  );
}
