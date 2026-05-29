import type { Request, Response } from "express";
import type { ThemeService } from "./service.js";

export class ThemeController {
  constructor(private themeService: ThemeService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const themes = await this.themeService.getAll();
    res.status(200).json(themes);
  };
}
