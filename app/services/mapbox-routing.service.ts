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

/**
 * Calls Google Routes API Compute Route Matrix:
 * 1 origin → N destinations. in single request, up to 25 destinations. Returns results in the same order as the input destinations.
 */
export async function googleDrivingOneToMany(
  origin: { lat: number; lon: number },
  destinations: { lat: number; lon: number }[],
): Promise<MatrixResult[]> {
  const apiKey = env.googleMapsApiKey();

  if (!apiKey) {
    return destinations.map(() => ({
      distanceMeters: null,
      durationSeconds: null,
    }));
  }

  if (destinations.length === 0) {
    return [];
  }

  const url =
    'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';

  const body = {
    origins: [
      {
        waypoint: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lon,
            },
          },
        },
      },
    ],
    destinations: destinations.map((destination) => ({
      waypoint: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lon,
          },
        },
      },
    })),
    travelMode: 'DRIVE',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'originIndex,destinationIndex,distanceMeters,duration,status,condition',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();

      logger.error('Google Routes matrix call failed', {
        status: res.status,
        error: errorText,
      });

      return destinations.map(() => ({
        distanceMeters: null,
        durationSeconds: null,
      }));
    }

    const data = (await res.json()) as {
      originIndex?: number;
      destinationIndex?: number;
      distanceMeters?: number;
      duration?: string;
      status?: {
        code?: number;
        message?: string;
      };
      condition?: string;
    }[];

    // Initialize results so the returned array is always
    // in exactly the same order as `destinations`.
    const results: MatrixResult[] = destinations.map(() => ({
      distanceMeters: null,
      durationSeconds: null,
    }));

    for (const route of data) {
      const destinationIndex = route.destinationIndex;

      if (
        destinationIndex == null ||
        destinationIndex < 0 ||
        destinationIndex >= destinations.length
      ) {
        continue;
      }

      // Google returns duration as e.g. "888s"
      const durationSeconds = route.duration
        ? parseFloat(route.duration.replace('s', ''))
        : null;

      results[destinationIndex] = {
        distanceMeters: route.distanceMeters ?? null,
        durationSeconds,
      };
    }

    return results;
  } catch (err) {
    logger.error('Google Routes matrix call failed', err);

    return destinations.map(() => ({
      distanceMeters: null,
      durationSeconds: null,
    }));
  }
}

/**
 * Calls Google Routes API Compute Routes (1 origin -> 1 destination) once per destination,
 * in parallel, and assembles the results into the same one-to-many shape/contract this function
 * always had. Was calling routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix (the Matrix
 * endpoint), which started failing with a 403 BILLING_DISABLED for this project even though
 * directions/v2:computeRoutes (this endpoint) works fine with the same key — Google bills/enables
 * the two as separate SKUs under the same "Routes API" product, so one working doesn't guarantee
 * the other does. Same "never throws — a failure just leaves that entry null" contract as before,
 * now per-destination rather than per-batch, so one destination failing doesn't blank the rest.
 */
export async function googleDrivingOneToMany1(
  origin: { lat: number; lon: number },
  destinations: { lat: number; lon: number }[],
): Promise<MatrixResult[]> {
   const apiKey = env.googleMapsApiKey();


  if (!apiKey || destinations.length === 0) {
    return destinations.map(() => ({
      distanceMeters: null,
      durationSeconds: null,
    }));
  }

  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const computeOne = async (destination: { lat: number; lon: number }): Promise<MatrixResult> => {
    const body = {
      origin:      { location: { latLng: { latitude: origin.lat,      longitude: origin.lon } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lon } } },
      travelMode: 'DRIVE',
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();

        logger.error('Google Routes computeRoutes call failed', {
          status: res.status,
          error: errorText,
        });

        return { distanceMeters: null, durationSeconds: null };
      }

      const data = (await res.json()) as {
        routes?: { distanceMeters?: number; duration?: string }[];
      };

      const route = data.routes?.[0];
      if (!route) return { distanceMeters: null, durationSeconds: null };

      // Google returns duration as e.g. "888s"
      const durationSeconds = route.duration
        ? parseFloat(route.duration.replace('s', ''))
        : null;

      return {
        distanceMeters: route.distanceMeters ?? null,
        durationSeconds,
      };
    } catch (err) {
      logger.error('Google Routes computeRoutes call failed', err);
      return { distanceMeters: null, durationSeconds: null };
    }
  };

  // One request per destination, run concurrently — computeRoutes has no batch/matrix form,
  // unlike the Matrix endpoint this replaces.
  return Promise.all(destinations.map(computeOne));
}
