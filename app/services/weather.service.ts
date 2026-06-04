import { env } from '../shared/config/env';
import { AppError } from '../shared/errors/app-error';

export async function getWeatherByPostcode(postcode: string) {
  const apiKey = env.weatherApiKey();
  if (!apiKey) throw new AppError(503, 'Weather API key not configured');

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(postcode)}&days=3&aqi=no&alerts=no`;

  const res  = await fetch(url);
  if (!res.ok) throw new AppError(502, 'Weather API request failed');

  return res.json();
}
