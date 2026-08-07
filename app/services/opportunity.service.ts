import { scanAll, batchGetItems } from '../shared/db/dynamo-helpers';
import { TABLES } from '../shared/db/tables';
import type { Venue, Club, Event, Route } from '../shared/assets/types/index.js';

type Opportunity = Venue | Event | Club | Route;

/**
 * DynamoDB-backed counterpart to AssetsService's opportunity methods
 * (getAllVenues/getVenueBySlug/etc.) — reads venues/events/clubs/routes from
 * the Venues/Events/Clubs/Routes tables instead of the static JSON assets.
 * Seeded from those same JSON files via scripts/seed-opportunities.ts.
 */
export class OpportunityService {
  // ── Cross-type lookup ────────────────────────────────────────────────────────

  /** `id` is the partition key on every opportunity table, so the type doesn't need to be known upfront — checks all four in parallel and returns whichever one has it. */
  async getById(id: string): Promise<Opportunity | null> {
    const [venue, event, club, route] = await Promise.all([
      this.getVenueBySlug(id),
      this.getEventBySlug(id),
      this.getClubBySlug(id),
      this.getRouteBySlug(id),
    ]);
    return venue ?? event ?? club ?? route ?? null;
  }

  // ── Venues ─────────────────────────────────────────────────────────────────

  async getAllVenues(): Promise<Venue[]> {
    return (await scanAll(TABLES.venues)) as any as Venue[];
  }

  async getVenueBySlug(slug: string): Promise<Venue | null> {
    const [item] = await batchGetItems(TABLES.venues, [slug]);
    return (item as any as Venue) ?? null;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async getAllEvents(): Promise<Event[]> {
    return (await scanAll(TABLES.events)) as any as Event[];
  }

  async getEventBySlug(slug: string): Promise<Event | null> {
    const [item] = await batchGetItems(TABLES.events, [slug]);
    return (item as any as Event) ?? null;
  }

  // ── Clubs ──────────────────────────────────────────────────────────────────

  async getAllClubs(): Promise<Club[]> {
    return (await scanAll(TABLES.clubs)) as any as Club[];
  }

  async getClubBySlug(slug: string): Promise<Club | null> {
    const [item] = await batchGetItems(TABLES.clubs, [slug]);
    return (item as any as Club) ?? null;
  }

  // ── Routes ─────────────────────────────────────────────────────────────────

  async getAllRoutes(): Promise<Route[]> {
    return (await scanAll(TABLES.routes)) as any as Route[];
  }

  async getRouteBySlug(slug: string): Promise<Route | null> {
    const [item] = await batchGetItems(TABLES.routes, [slug]);
    return (item as any as Route) ?? null;
  }
}
