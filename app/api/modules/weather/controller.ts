import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { WeatherService } from "./service.js";

export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const query = req.query;
    const data = await this.weatherService.get(query.q as string);

    res.status(StatusCodes.OK).json(data);
  };
}
