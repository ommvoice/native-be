export interface WeatherSuitabilityEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const WEATHER_SUITABILITY_ENUM: WeatherSuitabilityEntry[] = [
  { name: "Raining / wet", slug: "wet_rain", active: true },
  { name: "Windy (> X mph)", slug: "windy", active: true },
  { name: "Sunshine", slug: "sunshine", active: true },
  { name: "Snow / sleet / ice", slug: "snow_ice", active: true },
  { name: "Overcast / cloudy", slug: "overcast", active: true },
  { name: "Stormy / heavy rain / thunderstorms", slug: "storm_heavy_rain", active: true },
  { name: "Dry & mild", slug: "dry_mild", active: true },
  { name: "Dry & cold", slug: "dry_cold", active: true },
  { name: "Dry & warm", slug: "dry_warm", active: true },
  { name: "Dry & hot", slug: "dry_hot", active: true },
];

export type WeatherSuitabilitySlug = (typeof WEATHER_SUITABILITY_ENUM)[number]["slug"];
