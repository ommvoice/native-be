import type { Request, Response } from "express";
import type { SkillService } from "./skills.service.js";

export class SkillController {
  constructor(private skillService: SkillService) {}

  getInterestBased = async (_req: Request, res: Response): Promise<void> => {
    const skills = await this.skillService.getInterestBased();
    res.status(200).json(skills);
  };

  getAgeBased = async (_req: Request, res: Response): Promise<void> => {
    const skills = await this.skillService.getAgeBased();
    res.status(200).json(skills);
  };

  getAll = async (_req: Request, res: Response): Promise<void> => {
    const skills = await this.skillService.getAll();
    res.status(200).json(skills);
  };

  getLevels = async (_req: Request, res: Response): Promise<void> => {
    const levels = await this.skillService.getLevels();
    res.status(200).json(levels);
  };
}
