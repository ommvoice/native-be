import enums from './enums.json';
import venues from './venues.json';
import events from './events.json';
import routes from './routes.json';
import clubs from './clubs.json';

import type { Venue, Club, Event, Route } from './types';

export function getAllVenues(): Venue[] {
  return venues;
}

export function getAllClubs(): Club[] {
  return clubs;
}

export function getAllEvents(): Event[] {
  return events;
}

export function getAllRoutes(): Route[] {
  return routes;
}

export function getAllEnums(): any {
  return enums;
}
