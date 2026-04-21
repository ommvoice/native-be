import * as yup from "yup";
import type { Request, Response, NextFunction } from "express";

export const getCurrentQuerySchema = yup.object({
  q: yup
    .string()
    .required("q is required")
    .trim()
    .min(1, "q is required"),
});

export type GetCurrentWeatherQuery = yup.InferType<typeof getCurrentQuerySchema>;

function normalizeQueryForYup(query: Request["query"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    out[key] = Array.isArray(value) ? value[0] : value;
  }
  return out;
}

function validationErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: string[] }).errors;
    if (Array.isArray(errors) && errors[0]) return errors[0];
  }
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: string }).message;
    if (typeof msg === "string" && msg) return msg;
  }
  return "Invalid request";
}

export const validateQuery =
  (schema: yup.ObjectSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.validate(
        normalizeQueryForYup(req.query),
        { stripUnknown: true },
      );
      (req as Request & { validatedQuery: typeof validated }).validatedQuery =
        validated;
      next();
    } catch (err: unknown) {
      res.status(400).json({ error: validationErrorMessage(err) });
    }
  };
