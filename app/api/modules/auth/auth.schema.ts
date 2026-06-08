import * as yup from "yup";
import type { Request, Response, NextFunction } from "express";
import AppError from "../../shared/errors/AppError.js";

const loginSchema = yup.object({
  email: yup.string().email("Invalid email").required("email is required"),
  password: yup.string().min(8, "Password must be at least 8 characters").required("password is required"),
});

export function validateLoginBody(req: Request, _res: Response, next: NextFunction): void {
  loginSchema.validate(req.body, { abortEarly: false }).then(() => next()).catch((err: yup.ValidationError) => {
    next(new AppError(400, err.errors.join(", ")));
  });
}
