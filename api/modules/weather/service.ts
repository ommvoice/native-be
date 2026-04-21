import AppError from "../../shared/errors/AppError.js";
import type { WeatherDto } from "./types.js";

const CURRENT_URL = "https://api.weatherapi.com/v1/current.json";

function messageFromWeatherApiBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const err = (body as { error?: { message?: string } }).error;
  if (err && typeof err.message === "string" && err.message.trim()) {
    return err.message.trim();
  }
  return undefined;
}

export class WeatherService {
  async get(q: string): Promise<WeatherDto> {
    const key = process.env.WEATHER_API_KEY?.trim();
    if (!key) {
      throw new AppError(500, "Weather service is not configured.");
    }

    const url = new URL(CURRENT_URL);
    url.searchParams.set("key", key);
    url.searchParams.set("q", q);

    const res = await fetch(url);
    let body: any;
    try {
      body = await res.json();
    } catch {
      throw new AppError(502, "Invalid response from weather provider.");
    }

    if (!res.ok) {
      const fromApi = messageFromWeatherApiBody(body);
      const message = fromApi ?? `Weather request failed (${res.status}).`;
      const statusCode = res.status >= 500 ? 502 : 400;
      throw new AppError(statusCode, message);
    }

    return {
      icon: `https:${body.current.condition.icon}`,
      wind_mph: Math.round(body.current.wind_mph),
      temp_c: Math.round(body.current.temp_c),
      localtime: body.location.localtime
    };
  }
}
