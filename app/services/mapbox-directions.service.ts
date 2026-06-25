import { env } from '../shared/config/env';
import { AppError } from '../shared/errors/app-error';

const METERS_PER_MILE = 1609.344;

interface RouteInfo {
  userLat: number;
  userLng: number;
  destLat: number;
  destLng: number;
  distance: string;
  duration: string;
  routeCoords: number[][];
}

function formatDistance(meters: number): string {
  const miles = meters / METERS_PER_MILE;
  return `${Math.round(miles * 10) / 10} miles`;
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hrs} hrs ${mins} min` : `${hrs} hrs`;
}

export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<RouteInfo> {
  const token = env.mapboxToken();
  if (!token) throw new AppError(503, 'Mapbox token not configured');

  const coords = `${originLng},${originLat};${destLng},${destLat}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${token}`;

  const res = await fetch(url);
  const data = (await res.json()) as {
    code?: string;
    routes?: {
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
    }[];
  };

  if (!res.ok || data.code !== 'Ok' || !data.routes?.length) {
    throw new AppError(502, `Mapbox directions request failed with data: ${data}`);
  }

  //   const data = {
  //   "routes": [
  //     {
  //       "distance": 8425.3,
  //       "duration": 1120.6,
  //       "geometry": {
  //         "type": "LineString",
  //         "coordinates": [
  //           [73.0479, 31.4504],
  //           [73.0485, 31.4520],
  //           [73.0502, 31.4555],
  //           [73.0520, 31.4600],
  //           [73.0555, 31.4652],
  //           [73.0600, 31.4700]
  //         ]
  //       }
  //     }
  //   ],
  //   "code": "Ok",
  //   "uuid": "mock-uuid-123"
  // }


  const route = data.routes[0]!;

  return {
    userLat: originLat,
    userLng: originLng,
    destLat,
    destLng,
    distance:    formatDistance(route.distance),
    duration:    formatDuration(route.duration),
    routeCoords: route.geometry.coordinates,
  };
}
