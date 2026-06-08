import * as yup from "yup";
import { ValidationError } from "yup";
import type { Request, Response, NextFunction } from "express";

function firstQueryValue(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    const x = raw[0];
    return typeof x === "string" ? x : x != null ? String(x) : undefined;
  }
  return typeof raw === "string" ? raw : String(raw);
}

/** Express query values are strings; schema output type is `number` (not string → number mismatch). */
function queryNumber(fieldLabel: string, max: number) {
  return yup
    .number()
    .typeError(`${fieldLabel} must be a number`)
    .required(`${fieldLabel} is required`)
    .transform((_curr, originalValue) => {
      const s = firstQueryValue(originalValue)?.trim();
      if (s == null || s === "") return Number.NaN;
      const n = Number(s);
      return Number.isFinite(n) ? n : Number.NaN;
    })
    .positive(`${fieldLabel} must be positive`)
    .max(max, `${fieldLabel} is too large`);
}

/** Optional positive number from query; omit or empty string → `undefined`. */
function queryNumberOptional(fieldLabel: string, max: number) {
  return yup
    .number()
    .optional()
    .typeError(`${fieldLabel} must be a number`)
    .transform((_curr, originalValue) => {
      const s = firstQueryValue(originalValue)?.trim();
      if (s == null || s === "") return undefined;
      const n = Number(s);
      return Number.isFinite(n) ? n : Number.NaN;
    })
    .test(
      "finite-or-omit",
      `${fieldLabel} must be a number`,
      (v) => v === undefined || Number.isFinite(v),
    )
    .test(
      "positive-or-omit",
      `${fieldLabel} must be positive`,
      (v) => v === undefined || v > 0,
    )
    .test(
      "max-or-omit",
      `${fieldLabel} is too large`,
      (v) => v === undefined || v <= max,
    );
}

export const opportunitySearchQuerySchema = yup.object({
  parentId: yup
    .string()
    .required("parentId is required")
    .transform((_v, originalValue) => firstQueryValue(originalValue)?.trim() ?? "")
    .uuid("parentId must be a valid UUID"),
  childId: yup
    .string()
    .optional()
    .transform((_v, originalValue) => {
      const s = firstQueryValue(originalValue)?.trim();
      return s === "" || s == null ? undefined : s;
    })
    .uuid("childId must be a valid UUID"),
  interestSubCategorySlug: yup
    .string()
    .optional()
    .transform((_v, originalValue) => {
      const s = firstQueryValue(originalValue)?.trim();
      if (s == null || s === "") return undefined;
      return s;
    })
    .when("childId", {
      is: (childId: string | undefined) => Boolean(childId),
      then: (schema) =>
        schema
          .required("interestSubCategorySlug is required when childId is set")
          .min(1, "interestSubCategorySlug cannot be empty"),
      otherwise: (schema) => schema,
    }),
  maxTimeToReachMinutes: queryNumberOptional("maxTimeToReachMinutes", 24 * 60),
  maxDistanceMiles: queryNumberOptional("maxDistanceMiles", 500),
  /** Comma-separated `facilities.slug` values → normalized unique lowercase slugs. */
  facility: yup
    .mixed()
    .optional()
    .transform((_v, originalValue): string[] | undefined => {
      const s = firstQueryValue(originalValue)?.trim();
      if (s == null || s === "") return undefined;
      const parts = [
        ...new Set(
          s
            .split(",")
            .map((p) => p.trim().toLowerCase())
            .filter((p) => p.length > 0),
        ),
      ];
      return parts.length ? parts : undefined;
    })
    .test(
      "facility-slugs",
      "facility must list at least one slug when provided",
      (v) =>
        v === undefined ||
        (Array.isArray(v) &&
          v.length > 0 &&
          v.every((x) => typeof x === "string" && x.length > 0)),
    ),
});

type OpportunitySearchQuerySchemaInferred = yup.InferType<typeof opportunitySearchQuerySchema>;

export type OpportunitySearchQueryValidated = Omit<
  OpportunitySearchQuerySchemaInferred,
  "facility"
> & {
  facility?: string[];
};

/** Express 5 `req.query` is getter-only; validated params live on `res.locals`. */
export const OPPORTUNITY_SEARCH_QUERY_LOCAL_KEY = "opportunitySearchQuery" as const;

export const validateOpportunitySearchQuery =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schema: yup.ObjectSchema<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.validate(req.query, { stripUnknown: true });
      (res.locals as Record<string, unknown>)[OPPORTUNITY_SEARCH_QUERY_LOCAL_KEY] =
        validated;
      next();
    } catch (err: unknown) {
      if (ValidationError.isError(err)) {
        const msg =
          err.inner.length > 0
            ? err.inner[0]!.message
            : err.errors[0] ?? err.message;
        res.status(400).json({ message: msg });
        return;
      }
      const fallback =
        err instanceof Error ? err.message : "Invalid query";
      res.status(400).json({ message: fallback });
    }
  };
