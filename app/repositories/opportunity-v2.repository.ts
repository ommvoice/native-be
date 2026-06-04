import { GetCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { scanAll } from '../shared/db/dynamo-helpers';

export class OpportunityV2Repository {
  // ── Venues ─────────────────────────────────────────────────────────────────

  async listVenues(): Promise<Record<string, unknown>[]> {
    return scanAll(TABLES.opportunityVenuesV2);
  }

  async getVenue(id: string): Promise<Record<string, unknown> | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityVenuesV2, Key: { id } }));
    return (res.Item as Record<string, unknown>) ?? null;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async listEvents(): Promise<Record<string, unknown>[]> {
    return scanAll(TABLES.opportunityEventsV2);
  }

  async getEvent(id: string): Promise<Record<string, unknown> | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityEventsV2, Key: { id } }));
    return (res.Item as Record<string, unknown>) ?? null;
  }

  // ── Clubs ──────────────────────────────────────────────────────────────────

  async listClubs(): Promise<Record<string, unknown>[]> {
    return scanAll(TABLES.opportunityClubsV2);
  }

  async getClub(id: string): Promise<Record<string, unknown> | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityClubsV2, Key: { id } }));
    return (res.Item as Record<string, unknown>) ?? null;
  }

  // ── Routes ─────────────────────────────────────────────────────────────────

  async listRoutes(): Promise<Record<string, unknown>[]> {
    return scanAll(TABLES.opportunityRoutesV2);
  }

  async getRoute(id: string): Promise<Record<string, unknown> | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.opportunityRoutesV2, Key: { id } }));
    return (res.Item as Record<string, unknown>) ?? null;
  }
}
