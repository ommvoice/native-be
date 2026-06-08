import type { Request, Response, NextFunction } from "express";
import AppError from "../../shared/errors/AppError.js";
import { cognitoVerifier } from "./cognito.verifier.js";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid Authorization header"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = await cognitoVerifier.verify(token);
    req.user = {
      sub: payload.sub,
      email: payload.email as string,
    };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}
