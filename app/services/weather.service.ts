import { env } from '../shared/config/env';
import { AppError } from '../shared/errors/app-error';
import { logger } from '../shared/utils/logger';

function parseApiError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const err = (body as { error?: { message?: string } }).error;
  if (err && typeof err.message === 'string' && err.message.trim()) return err.message.trim();
  return undefined;
}

export async function getWeatherByPostcode(postcode: string) {
  const key = await env.weatherApiKey();
  if (!key) throw new AppError(500, 'Weather service is not configured.');

  const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${encodeURIComponent(`${postcode}, GB`)}`;

  const res = await fetch(url);
  let body: any;
  try {
    body = await res.json();
  } catch {
    throw new AppError(502, 'Invalid response from weather provider.');
  }

  if (!res.ok) {
    // Provider error text stays in our logs, not in the client response.
    logger.warn('Weather provider error', { status: res.status, message: parseApiError(body) });
    throw new AppError(res.status >= 500 ? 502 : 400, 'Weather is unavailable for this postcode right now.');
  }

  return {
    condition: {
      text: body.current.condition.text,
      icon: `https:${body.current.condition.icon}`,
      code: body.current.condition.code,
      isDay: body.current.is_day === 1,
      isWindy: body.current.wind_mph >= 35,
    },
    wind_mph:  Math.round(body.current.wind_mph),
    temp_c:    Math.round(body.current.temp_c),
    localtime: body.location.localtime,
  };
}
