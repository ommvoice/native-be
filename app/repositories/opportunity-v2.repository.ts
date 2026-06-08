import { GetCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { scanAll } from '../shared/db/dynamo-helpers';
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
  // ── Venues ─────────────────────────────────────────────────────────────────

  async listVenues(): Promise<OpportunityVenueV2[]> {
    const items = await scanAll(TABLES.opportunityVenuesV2);
    return items.map(enrichVenue);
  }

  async getVenue(id: string): Promise<OpportunityVenueV2 | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityVenuesV2, Key: { id } }));
    return res.Item ? enrichVenue(res.Item as Record<string, unknown>) : null;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async listEvents(): Promise<OpportunityEventV2[]> {
    const items = await scanAll(TABLES.opportunityEventsV2);
    return items.map(enrichEvent);
  }

  async getEvent(id: string): Promise<OpportunityEventV2 | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityEventsV2, Key: { id } }));
    return res.Item ? enrichEvent(res.Item as Record<string, unknown>) : null;
  }

  // ── Clubs ──────────────────────────────────────────────────────────────────

  async listClubs(): Promise<OpportunityClubV2[]> {
    const items = await scanAll(TABLES.opportunityClubsV2);
    return items.map(enrichClub);
  }

  async getClub(id: string): Promise<OpportunityClubV2 | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityClubsV2, Key: { id } }));
    return res.Item ? enrichClub(res.Item as Record<string, unknown>) : null;
  }

  // ── Routes ─────────────────────────────────────────────────────────────────

  async listRoutes(): Promise<OpportunityRouteV2[]> {
    const items = await scanAll(TABLES.opportunityRoutesV2);
    return items.map(enrichRoute);
  }

  async getRoute(id: string): Promise<OpportunityRouteV2 | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityRoutesV2, Key: { id } }));
    return res.Item ? enrichRoute(res.Item as Record<string, unknown>) : null;
  }
}
