import * as yup from "yup";
import type { Request, Response, NextFunction } from "express";

export const getAllQuerySchema = yup.object({
  parentId: yup
    .string()
    .required("parentId is required")
    .uuid("parentId must be a valid UUID"),
  childId: yup.string().optional().uuid("childId must be a valid UUID"),
});

export type GetAllWishlistsQuery = yup.InferType<typeof getAllQuerySchema>;

const wishlistItemInputSchema = yup
  .object({
    opportunityVenueId: yup
      .string()
      .uuid("opportunityVenueId must be a valid UUID")
      .optional(),
    opportunityEventId: yup
      .string()
      .uuid("opportunityEventId must be a valid UUID")
      .optional(),
    opportunityClubId: yup
      .string()
      .uuid("opportunityClubId must be a valid UUID")
      .optional(),
    opportunityRouteId: yup
      .string()
      .uuid("opportunityRouteId must be a valid UUID")
      .optional(),
  })
  .test(
    "exactly-one-opportunity",
    "Each item must set exactly one of opportunityVenueId, opportunityEventId, opportunityClubId, opportunityRouteId",
    (value) => {
      if (!value) return false;
      const set = [
        value.opportunityVenueId,
        value.opportunityEventId,
        value.opportunityClubId,
        value.opportunityRouteId,
      ].filter((v) => v != null && v !== "");
      return set.length === 1;
    },
  );

export const createWishlistBodySchema = yup.object({
  parentId: yup
    .string()
    .required("parentId is required")
    .uuid("parentId must be a valid UUID"),
  childId: yup
    .string()
    .required("childId is required")
    .uuid("childId must be a valid UUID"),
  name: yup.string().required("name is required").trim().min(1, "name is required"),
  color: yup.string().required("color is required").trim().min(1, "color is required"),
  items: yup
    .array()
    .of(wishlistItemInputSchema)
    .min(1, "At least one item is required")
    .required("items is required"),
});

export type CreateWishlistBody = yup.InferType<typeof createWishlistBodySchema>;
export type CreateWishlistItemInput = yup.InferType<typeof wishlistItemInputSchema>;

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

/** Express `req.query` is getter-only; assigning to it throws. Duplicate keys can yield `string[]`. */
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
