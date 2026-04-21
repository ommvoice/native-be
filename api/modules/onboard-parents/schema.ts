import * as yup from "yup";
import type { Request, Response, NextFunction } from "express";

export const validateBody =
  (schema: yup.ObjectSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.validate(req.body, { stripUnknown: true });
      next();
    } catch (err: any) {
      res.status(400).json({ error: err.errors?.[0] || "Invalid request" });
    }
  };

export const createOnboardParentSchema = yup.object({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  firstNameOrNickName: yup.string().required("FirstNameOrNickName is required"),
  postCode: yup.string().required("PostCode is required"),
  password: yup
    .string()
    .trim()
    .min(12, "Password must be at least 12 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[0-9]/, "Must contain at least one number")
    .matches(/[^A-Za-z0-9]/, "Must contain at least one symbol")
    .required("Password is required"),
  children: yup
    .array()
    .of(
      yup.object({
        nameOrNickName: yup
          .string()
          .required("Child name or nickname is required"),

        dateOfBirth: yup.string().required("Child date of birth is required"),
      }),
    )
    .optional(),
});
