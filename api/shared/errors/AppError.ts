export type ErrorDetail = {
  property: string;
  constraints?: Record<string, string>;
};

class AppError extends Error {
  public statusCode: number;
  public details?: ErrorDetail[];

  constructor(
    statusCode: number,
    message?: string,
  ) {
    if (typeof statusCode !== "number")
      throw new Error("statusCode must be a number");
    if (typeof message !== "string")
      throw new Error("message must be a string");

    super(message);

    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
