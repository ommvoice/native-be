/**
 * Mapbox Navigation APIs: Matrix (batch) and Directions (single pair).
 * Matrix requires at least two source×destination elements; for one destination we use Directions v5.
 */

const MATRIX_BASE = "https://api.mapbox.com/directions-matrix/v1/mapbox/driving";
const DIRECTIONS_BASE = "https://api.mapbox.com/directions/v5/mapbox/driving";

/** Max coordinates per Matrix request for `mapbox/driving` (parent + destinations). */
export const MAPBOX_MATRIX_MAX_COORDINATES = 25;

/** Parent at index 0 → max destinations per Matrix call. */
export const MAPBOX_MATRIX_MAX_DESTINATIONS = MAPBOX_MATRIX_MAX_COORDINATES - 1;

export type RoutingLeg = {
  distanceMeters: number;
  durationSeconds: number;
};

function lonLatPath(coords: { lon: number; lat: number }[]): string {
  return coords.map((c) => `${c.lon},${c.lat}`).join(";");
}

export type MatrixRowParse = {
  /** One entry per destination, same order as requested. */
  legs: Array<{ distanceMeters: number | null; durationSeconds: number | null }>;
};

export function parseMatrixOneToManyResponse(
  body: unknown,
  destinationCount: number,
): MatrixRowParse {
  if (
    typeof body !== "object" ||
    body === null ||
    !("durations" in body) ||
    !("distances" in body)
  ) {
    return { legs: Array.from({ length: destinationCount }, () => ({ distanceMeters: null, durationSeconds: null })) };
  }
  const o = body as {
    code?: string;
    durations?: (number | null)[][];
    distances?: (number | null)[][];
  };
  if (o.code !== "Ok") {
    return { legs: Array.from({ length: destinationCount }, () => ({ distanceMeters: null, durationSeconds: null })) };
  }
  const d0 = o.durations?.[0];
  const s0 = o.distances?.[0];
  const legs: Array<{ distanceMeters: number | null; durationSeconds: number | null }> = [];
  for (let j = 0; j < destinationCount; j++) {
    const durationSeconds =
      Array.isArray(d0) && typeof d0[j] === "number" && Number.isFinite(d0[j]) ? d0[j]! : null;
    const distEl = Array.isArray(s0) ? s0[j] : null;
    const distanceMeters =
      typeof distEl === "number" && Number.isFinite(distEl) ? distEl : null;
    legs.push({ distanceMeters, durationSeconds });
  }
  return { legs };
}

/**
 * One origin → many destinations. Uses Matrix when `destinations.length >= 2`, else Directions (2-waypoint route).
 */
export async function mapboxDrivingOneToMany(
  accessToken: string,
  origin: { lon: number; lat: number },
  destinations: { lon: number; lat: number }[],
): Promise<Array<{ distanceMeters: number | null; durationSeconds: number | null }>> {
  if (destinations.length === 0) return [];

  if (destinations.length === 1) {
    const pair = await mapboxDrivingDirectionsPair(accessToken, origin, destinations[0]!);
    return [pair];
  }

  const all = [origin, ...destinations];
  const coordPath = lonLatPath(all);
  const destIndices = destinations.map((_, i) => i + 1).join(";");
  const url = new URL(`${MATRIX_BASE}/${coordPath}`);
  url.searchParams.set("sources", "0");
  url.searchParams.set("destinations", destIndices);
  url.searchParams.set("annotations", "distance,duration");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    return destinations.map(() => ({ distanceMeters: null, durationSeconds: null }));
  }
  const parsed = parseMatrixOneToManyResponse(body, destinations.length);
  return parsed.legs;
}

async function mapboxDrivingDirectionsPair(
  accessToken: string,
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): Promise<{ distanceMeters: number | null; durationSeconds: number | null }> {
  const coordPath = lonLatPath([a, b]);
  const url = new URL(`${DIRECTIONS_BASE}/${coordPath}`);
  url.searchParams.set("overview", "false");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  const body = (await res.json().catch(() => null)) as {
    routes?: { distance?: number; duration?: number }[];
  } | null;
  if (!res.ok || !body?.routes?.[0]) {
    return { distanceMeters: null, durationSeconds: null };
  }
  const r = body.routes[0]!;
  const distanceMeters = typeof r.distance === "number" ? r.distance : null;
  const durationSeconds = typeof r.duration === "number" ? r.duration : null;
  return { distanceMeters, durationSeconds };
}
