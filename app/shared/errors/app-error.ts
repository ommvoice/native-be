export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name        = 'AppError';
    this.statusCode  = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
