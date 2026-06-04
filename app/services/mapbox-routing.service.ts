import { env } from '../shared/config/env';
import { logger } from '../shared/utils/logger';

export const MAPBOX_MATRIX_MAX_DESTINATIONS = 24;

interface MatrixResult {
  distanceMeters: number | null;
  durationSeconds: number | null;
}

/** Calls Mapbox Matrix API: 1 origin → N destinations (max 24). */
export async function mapboxDrivingOneToMany(
  origin: { lat: number; lon: number },
  destinations: { lat: number; lon: number }[],
): Promise<MatrixResult[]> {
  const token = env.mapboxToken();
  if (!token) return destinations.map(() => ({ distanceMeters: null, durationSeconds: null }));

  const coords = [origin, ...destinations]
    .map((c) => `${c.lon},${c.lat}`)
    .join(';');

  const sources      = '0';
  const destinationsParam = destinations.map((_, i) => i + 1).join(';');

  const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}?sources=${sources}&destinations=${destinationsParam}&annotations=distance,duration&access_token=${token}`;

  try {
    const res  = await fetch(url);
    const data = (await res.json()) as {
      durations?: (number | null)[][];
      distances?: (number | null)[][];
    };

    const durations  = data.durations?.[0] ?? [];
    const distances  = data.distances?.[0]  ?? [];

    return destinations.map((_, i) => ({
      durationSeconds: durations[i]  != null ? durations[i]!  : null,
      distanceMeters:  distances[i]  != null ? distances[i]!  : null,
    }));
  } catch (err) {
    logger.error('Mapbox matrix call failed', err);
    return destinations.map(() => ({ distanceMeters: null, durationSeconds: null }));
  }
}
