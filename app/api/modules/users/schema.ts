import * as yup from "yup";
import type { Request, Response, NextFunction } from "express";

export const getByIdSchema = yup.object({
  id: yup
    .string()
    .required("id is required")
    .uuid("id must be a valid UUID") 
});

export const getByEmailSchema = yup.object({
  email: yup
    .string()
    .required("email is required")
});

export const validateParams = (schema: yup.ObjectSchema<any>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.params = await schema.validate(req.params, { stripUnknown: true });
    next();
  } catch (err: any) {
    res.status(400).json({ error: err.errors?.[0] || "Invalid request" });
  }
};

export const validateBody = (schema: yup.ObjectSchema<any>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.params = await schema.validate(req.body, { stripUnknown: true });
    next();
  } catch (err: any) {
    res.status(400).json({ error: err.errors?.[0] || "Invalid request" });
  }
};

export const validateQuery = (schema: yup.ObjectSchema<any>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.params = await schema.validate(req.query, { stripUnknown: true });
    next();
  } catch (err: any) {
    res.status(400).json({ error: err.errors?.[0] || "Invalid request" });
  }
};
