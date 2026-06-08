import * as yup from "yup";
import type { Request, Response, NextFunction } from "express";

export const getByIdSchema = yup.object({
  id: yup.string().required("id is required").uuid("id must be a valid UUID"),
});

export const updateInterestPreferencesSchema = yup.object({
  interestCategoryIds: yup
    .array()
    .of(
      yup
        .string()
        .required()
        .uuid("Each interest category id must be a valid UUID"),
    )
    .default([])
    .required(),
  interestSubCategoryIds: yup
    .array()
    .of(
      yup
        .string()
        .required()
        .uuid("Each interest subcategory id must be a valid UUID"),
    )
    .default([])
    .required(),
});

export type UpdateInterestPreferencesBody = yup.InferType<
  typeof updateInterestPreferencesSchema
>;

export const validateParams =
  (schema: yup.ObjectSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.validate(req.params, { stripUnknown: true });
      next();
    } catch (err: any) {
      res.status(400).json({ error: err.errors?.[0] || "Invalid request" });
    }
  };

export const validateBody =
  (schema: yup.ObjectSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.validate(req.body, { stripUnknown: true });
      next();
    } catch (err: any) {
      res.status(400).json({ error: err.errors?.[0] || "Invalid request" });
    }
  };
