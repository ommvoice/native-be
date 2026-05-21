/**
 * UK postcode → coordinates for distance scoring.
 * Seeded demo postcodes and a few common lookups; unknown codes return null unless
 * `lookupPostcodeCoordsFromApi` is used.
 */

export function normalizeUkPostcode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const compact = raw.toUpperCase().replace(/\s+/g, "").trim();
  if (compact.length < 5) return null;
  const inward = compact.slice(-3);
  const outward = compact.slice(0, -3);
  return `${outward} ${inward}`;
}

/** Known coordinates (WGS84) used by demo seed and tests. */
export const STATIC_POSTCODE_COORDS: Record<string, { latitude: number; longitude: number }> = {
  "HP2 7DB": { latitude: 51.773282, longitude: -0.434612 },
  "HP1 1BB": { latitude: 51.751393, longitude: -0.471936 },
  "WD3 3RX": { latitude: 51.651107, longitude: -0.431916 },
  "AL2 1AF": { latitude: 51.712302, longitude: -0.300929 },
  "EX6 8JQ": { latitude: 50.642928, longitude: -3.462935 },
  /** From main `prisma/seed.ts` opportunities */
  "EX8 5BY": { latitude: 50.619168, longitude: -3.365858 },
  "EN1 3PL": { latitude: 51.658672, longitude: -0.060716 },
  /** Hertfordshire / Beds belt (main seed near HP2 7DB) */
  "HP3 8JG": { latitude: 51.73951, longitude: -0.446281 },
  "HP4 1AB": { latitude: 51.761548, longitude: -0.568634 },
  "WD17 1NA": { latitude: 51.659461, longitude: -0.401221 },
  "LU1 1AA": { latitude: 51.879985, longitude: -0.422902 },
  "MK40 1DY": { latitude: 52.136759, longitude: -0.478306 },
};

export function lookupStaticPostcodeCoords(
  postcode: string | null | undefined,
): { latitude: number; longitude: number } | null {
  const key = normalizeUkPostcode(postcode);
  if (!key) return null;
  return STATIC_POSTCODE_COORDS[key] ?? null;
}

export async function lookupPostcodeCoordsFromApi(
  postcode: string | null | undefined,
): Promise<{ latitude: number; longitude: number } | null> {
  const key = normalizeUkPostcode(postcode);
  if (!key) return null;
  const cached = STATIC_POSTCODE_COORDS[key];
  if (cached) return cached;

  const encoded = encodeURIComponent(key);
  const res = await fetch(`https://api.postcodes.io/postcodes/${encoded}`);
  if (!res.ok) return null;
  const body = (await res.json()) as {
    status: number;
    result?: { latitude: number; longitude: number };
  };
  if (body.status !== 200 || !body.result) return null;
  return {
    latitude: body.result.latitude,
    longitude: body.result.longitude,
  };
}
