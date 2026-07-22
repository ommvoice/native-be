import { AssetsService } from '../services/assets.service';
import {
  enrichVenue,
  enrichEvent,
  enrichClub,
  enrichRoute,
} from '../shared/utils/enrichers/opportunity-v2.enrichers';
import type {
  OpportunityVenueV2,
  OpportunityEventV2,
  OpportunityClubV2,
  OpportunityRouteV2,
} from '../shared/types/opportunity-v2.types';

export class OpportunityV2Repository {
  private readonly assets = new AssetsService();

  // ── Venues ─────────────────────────────────────────────────────────────────

  async listVenues(): Promise<OpportunityVenueV2[]> {
    return this.assets.getAllVenues().map((v) => enrichVenue(v as unknown as Record<string, unknown>));
  }

  async getVenue(slug: string): Promise<OpportunityVenueV2 | null> {
    const item = this.assets.getVenueBySlug(slug);
    return item ? enrichVenue(item as unknown as Record<string, unknown>) : null;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async listEvents(): Promise<OpportunityEventV2[]> {
    return this.assets.getAllEvents().map((e) => enrichEvent(e as unknown as Record<string, unknown>));
  }

  async getEvent(slug: string): Promise<OpportunityEventV2 | null> {
    const item = this.assets.getEventBySlug(slug);
    return item ? enrichEvent(item as unknown as Record<string, unknown>) : null;
  }

  // ── Clubs ──────────────────────────────────────────────────────────────────

  async listClubs(): Promise<OpportunityClubV2[]> {
    return this.assets.getAllClubs().map((c) => enrichClub(c as unknown as Record<string, unknown>));
  }

  async getClub(slug: string): Promise<OpportunityClubV2 | null> {
    const item = this.assets.getClubBySlug(slug);
    return item ? enrichClub(item as unknown as Record<string, unknown>) : null;
  }

  // ── Routes ─────────────────────────────────────────────────────────────────

  async listRoutes(): Promise<OpportunityRouteV2[]> {
    return this.assets.getAllRoutes().map((r) => enrichRoute(r as unknown as Record<string, unknown>));
  }

  async getRoute(slug: string): Promise<OpportunityRouteV2 | null> {
    const item = this.assets.getRouteBySlug(slug);
    return item ? enrichRoute(item as unknown as Record<string, unknown>) : null;
  }
}
