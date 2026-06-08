import type { Request, Response } from "express";
import type { ThemeService } from "./service.js";
import type { ThemeListFilters } from "./types.js";

function parseFilters(req: Request): ThemeListFilters {
  const interestId = typeof req.query.interestId === "string" ? req.query.interestId : undefined;
  const interestSlug =
    typeof req.query.interestSlug === "string" ? req.query.interestSlug : undefined;
  const linkedOnly =
    req.query.linkedOnly === "false" || req.query.linkedOnly === "0" ? false : true;

  return {
    ...(interestId ? { interestId } : {}),
    ...(interestSlug ? { interestSlug } : {}),
    linkedOnly,
  };
}

export class ThemeController {
  constructor(private themeService: ThemeService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const themes = await this.themeService.getAll(parseFilters(req));
    res.status(200).json(themes);
  };
}
