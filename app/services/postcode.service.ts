import { env } from '../shared/config/env';

export interface Location {
  latitude: number;
  longitude: number;
  placeName: string;
}

/** Resolves a UK postcode to lat/lng via Mapbox geocoding. */
export async function getLocationForPostCode(postCode: string): Promise<Location | null> {
  const token = env.mapboxToken();
  if (!token) return null;

  const encoded  = encodeURIComponent(postCode.trim());
  const url      = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=GB&types=postcode&limit=1&access_token=${token}`;

  try {
    const res  = await fetch(url);
    const data = (await res.json()) as { features?: { center: [number, number], place_name: string }[] };
    const feat = data.features?.[0];
    if (!feat) return null;
    const [longitude, latitude] = feat.center;
    const placeName = feat.place_name ?? 'Unknown';
    return { latitude, longitude, placeName };
  } catch {
    return null;
  }
}

export function normalizeUkPostcode(raw?: string): string | null {
  if (!raw) return null;
  return raw.trim().toUpperCase().replace(/\s+/g, ' ') || null;
}
