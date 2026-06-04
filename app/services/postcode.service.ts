import { env } from '../shared/config/env';

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Resolves a UK postcode to lat/lng via Mapbox geocoding. */
export async function getLatLngForPostCode(postCode: string): Promise<LatLng | null> {
  const token = env.mapboxToken();
  if (!token) return null;

  const encoded  = encodeURIComponent(postCode.trim());
  const url      = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=GB&types=postcode&limit=1&access_token=${token}`;

  try {
    const res  = await fetch(url);
    const data = (await res.json()) as { features?: { center: [number, number] }[] };
    const feat = data.features?.[0];
    if (!feat) return null;
    const [longitude, latitude] = feat.center;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

export function normalizeUkPostcode(raw?: string): string | null {
  if (!raw) return null;
  return raw.trim().toUpperCase().replace(/\s+/g, ' ') || null;
}
