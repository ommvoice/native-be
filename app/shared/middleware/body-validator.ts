import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { MiddlewareObj } from '@middy/core';
import type { AnyObjectSchema } from 'yup';
import { AppError } from '../errors/app-error';

export function bodyValidator(schema: AnyObjectSchema): MiddlewareObj {
  return {
    before: async (request) => {
      try {
        const validated = await schema.validate(request.event.body, {
          abortEarly:  false,
          stripUnknown: true,
        });
        // Replace body with the validated + stripped object
        (request.event as APIGatewayProxyEvent & { body: unknown }).body = validated;
      } catch (err: unknown) {
        const messages =
          (err as { inner?: { message: string }[] }).inner?.map((e) => e.message) ??
          [(err as Error).message];
        throw new AppError(422, messages.join('; '));
      }
    },
  };
}

/**
 * Middy middleware: validates query string parameters against a Yup schema.
 */
export function queryValidator(schema: AnyObjectSchema): MiddlewareObj {
  return {
    before: async (request) => {
      try {
        const validated = await schema.validate(
          request.event.queryStringParameters ?? {},
          { abortEarly: false, stripUnknown: true },
        );
        request.event.queryStringParameters = validated as Record<string, string>;
      } catch (err: unknown) {
        const messages =
          (err as { inner?: { message: string }[] }).inner?.map((e) => e.message) ??
          [(err as Error).message];
        throw new AppError(422, messages.join('; '));
      }
    },
  };
}
