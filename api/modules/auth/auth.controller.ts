import type { Request, Response } from "express";
import type { AuthService } from "./auth.service.js";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await this.authService.register(email, password);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await this.authService.login(email, password);
    res.status(200).json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.me(req.user!.sub);
    res.status(200).json(user);
  };
}
