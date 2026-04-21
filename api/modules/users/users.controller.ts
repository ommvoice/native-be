import type { Request, Response } from "express";
import type { UserService } from "./users.service.js";

export class UserController {
  constructor(private userService: UserService) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const entity = await this.userService.getById(id as string);

    res.status(200).json(entity);
  };

  getByEmail = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.query;
    const entity = await this.userService.getByEmail(email as string);

    res.status(200).json(entity);
  };
}
