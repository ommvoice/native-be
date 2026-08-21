import enums from '../shared/assets/enums.json' with { type: 'json' };
import venues from '../shared/assets/venues.json' with { type: 'json' };
import events from '../shared/assets/events.json' with { type: 'json' };
import routes from '../shared/assets/routes.json' with { type: 'json' };
import clubs from '../shared/assets/clubs.json' with { type: 'json' };


import type { Venue, Club, Event, Route } from '../shared/assets/types/index.js';
import type { InterestCategoryRecord, InterestSubCategoryRecord } from '../repositories/interest.repository';
import type { ThemeRecord, ThemeVariantRecord } from '../repositories/theme.repository';
import type { SkillRecord } from '../repositories/skill.repository';
import type { FacilityRecord } from '../repositories/facility.repository';
import type { EnumEntry, EnumSeasonalHighlight, EnumInterestTag } from '../shared/types/assets.types';
import { OpportunityService } from './opportunity.service';

// Enum-sourced records (`{name, slug, active}`) have no real createdAt/updatedAt —
// this fixed placeholder keeps the existing Record shapes intact without implying a real timestamp.
const SYNTHETIC_TIMESTAMP = '2025-01-01T00:00:00.000Z';


export class AssetsService {
  private readonly opportunityService = new OpportunityService();
  // ── Opportunities ──────────────────────────────────────────────────────────

  async getAllVenues(): Promise<Venue[]> {
    return venues as Venue[];
    return this.opportunityService.getAllVenues();
  }

  async getAllEvents(): Promise<Event[]> {
     return events as Event[];
    return this.opportunityService.getAllEvents();
  }

  async getAllClubs(): Promise<Club[]> {
    return clubs as Club[];
    return this.opportunityService.getAllClubs();
  }

  async getAllRoutes(): Promise<Route[]> {
    return routes as Route[];
    return this.opportunityService.getAllRoutes();
  }

  async getVenueBySlug(slug: string): Promise<Venue | null> {
    return (await this.getAllVenues()).find((v) => v.id === slug) ?? null;
    return this.opportunityService.getVenueBySlug(slug);
  }

  async getEventBySlug(slug: string): Promise<Event | null> {
    return (await this.getAllEvents()).find((e) => e.id === slug) ?? null;
    return this.opportunityService.getEventBySlug(slug);
  }

  async getClubBySlug(slug: string): Promise<Club | null> {
    return (await this.getAllClubs()).find((c) => c.id === slug) ?? null;
    return this.opportunityService.getClubBySlug(slug);
  }

  async getRouteBySlug(slug: string): Promise<Route | null> {
    return (await this.getAllRoutes()).find((r) => r.id === slug) ?? null;
    return this.opportunityService.getRouteBySlug(slug);
  }

  // ── Interests ──────────────────────────────────────────────────────────────

  getInterestCategories(): InterestCategoryRecord[] {
    return (enums.interestCategory as EnumEntry[]).map((c) => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      createdAt: SYNTHETIC_TIMESTAMP,
      updatedAt: SYNTHETIC_TIMESTAMP,
    }));
  }

  getInterestSubCategories(categorySlug?: string): InterestSubCategoryRecord[] {
    // A handful of sheet-discovered entries have no relation backfilled yet —
    // treat a missing array the same as an empty one rather than throwing.
    const all = enums.opportunityTheme as (EnumEntry & { interestCategorySlugs?: string[] })[];
    const filtered = categorySlug
      ? all.filter((t) => (t.interestCategorySlugs ?? []).includes(categorySlug))
      : all;
    return filtered.map((t) => ({
      id: t.slug,
      slug: t.slug,
      name: t.name,
      interestId: (t.interestCategorySlugs ?? [])[0] ?? '',
      parentId: null,
      suitableForAge: null,
      createdAt: SYNTHETIC_TIMESTAMP,
      updatedAt: SYNTHETIC_TIMESTAMP,
    }));
  }

  // ── Themes ─────────────────────────────────────────────────────────────────

  getThemes(): ThemeRecord[] {
    // A handful of sheet-discovered entries have no relation backfilled yet —
    // treat a missing array the same as an empty one rather than throwing.
    return (enums.opportunityTheme as (EnumEntry & { interestCategorySlugs?: string[] })[]).map((t) => ({
      id: t.slug,
      slug: t.slug,
      name: t.name,
      interestId: (t.interestCategorySlugs ?? []),
      description: null,
      imageUrl: null,
      createdAt: SYNTHETIC_TIMESTAMP,
      updatedAt: SYNTHETIC_TIMESTAMP,
    }));
  }

  getThemeVariants(themeSlug?: string): ThemeVariantRecord[] {
    // A handful of sheet-discovered entries have no relation backfilled yet —
    // treat a missing array the same as an empty one rather than throwing.
    const all = enums.opportunityThemeVariant as (EnumEntry & { opportunityThemeSlugs?: string[] })[];
    const filtered = themeSlug
      ? all.filter((v) => (v.opportunityThemeSlugs ?? []).includes(themeSlug))
      : all;
    return filtered.map((v) => ({
      id: v.slug,
      slug: v.slug,
      name: v.name,
      themeId: (v.opportunityThemeSlugs ?? [])[0] ?? '',
      description: null,
      imageUrl: null,
      createdAt: SYNTHETIC_TIMESTAMP,
      updatedAt: SYNTHETIC_TIMESTAMP,
    }));
  }

  // ── Skills ─────────────────────────────────────────────────────────────────

  getSkills(): SkillRecord[] {
    return (enums.generalSkill as EnumEntry[]).map((s) => ({
      id: s.slug,
      slug: s.slug,
      label: s.name,
      description: '',
      type: 'INTEREST_BASED' as const,
      subCategoryId: null,
      minAge: null,
      maxAge: null,
      createdAt: SYNTHETIC_TIMESTAMP,
      updatedAt: SYNTHETIC_TIMESTAMP,
    }));
  }

  // ── Facilities ─────────────────────────────────────────────────────────────

  getFacilities(): FacilityRecord[] {
    const groups: [EnumEntry[], FacilityRecord['type']][] = [
      [enums.functionalFacility as EnumEntry[], 'GENERAL'],
      [enums.parentFacility as EnumEntry[], 'PARENT'],
      [enums.kidsFacility as EnumEntry[], 'KID'],
      [enums.dogFacility as EnumEntry[], 'DOG'],
    ];
    return groups.flatMap(([facilities, type]) =>
      facilities.map((f) => ({
        id: f.slug,
        slug: f.slug,
        label: f.name,
        type,
        createdAt: SYNTHETIC_TIMESTAMP,
        updatedAt: SYNTHETIC_TIMESTAMP,
      })),
    );
  }

  getFacilityBySlug(slug: string): FacilityRecord | null {
    return this.getFacilities().find((f) => f.slug === slug) ?? null;
  }

  // ── Enums (raw passthrough) ──────────────────────────────────────────────────

  getAllEnums(): typeof enums {
    return enums;
  }

  // ── Slug -> human-readable name (combined across every enum group) ─────────

  private slugLabelMap: Map<string, string> | null = null;

  /** Every enum entry across all groups (opportunityTheme, skillArea, bookingType, ...), flattened into one array — the slug is unique across groups, so one combined lookup works regardless of which group a given field's slug came from. */
  getAllEnumEntries(): { slug: string; name: string }[] {
    return (Object.values(enums) as EnumEntry[][]).flat().map((e) => ({ slug: e.slug, name: e.name }));
  }

  /** Resolve a single slug to its human-readable name. Returns undefined if the slug isn't a known enum value (e.g. the field is genuinely free text, not enum-backed). */
  getEnumLabel(slug: string): string | undefined {
    if (!this.slugLabelMap) {
      this.slugLabelMap = new Map(this.getAllEnumEntries().map((e) => [e.slug, e.name]));
    }
    return this.slugLabelMap.get(slug);
  }

  getIntrestTags() : EnumInterestTag[]{

    return enums.interestTags as EnumInterestTag[];
  }

  getSeasonalHighlights(season:string): EnumSeasonalHighlight[] {
    const allSeasonalHighlight = enums.seasonalHighlight as EnumSeasonalHighlight[];

    if(season && season !== ""){
      return allSeasonalHighlight.filter((h)=> h.seasonalTagSlugs && h.seasonalTagSlugs.includes(season))
    }

    return [] 
  }
}
