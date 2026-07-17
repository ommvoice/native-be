export type OppType = 'venue' | 'route' | 'club' | 'event';

export interface PricingTier {
  label: string;
  price: string;
  description?: string;
}

export interface LiveStatus {
  variant: 'open' | 'soon' | 'closed';
  message: string;
}

export interface SeasonalHighlight {
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  highlight: string;
  tags: string[];
}

export interface OpportunityDetail {
  // ── Core ──────────────────────────────────────────────
  id:          string;
  opp_type:    OppType;
  name:        string;
  description: string | null;
  image_urls:  string[] | null;

  // Location
  address:   string | null;
  city:      string | null;
  postcode:  string | null;
  latitude:  number | null;
  longitude: number | null;

  // Classification
  interest_category:         string | null;
  opp_category:              string | null;
  subcategory:               string | null;
  activity_effort_tag:       string | null;
  opportunity_theme_variant: string | null;

  // Suitability
  min_age:               number | null;
  max_age:               number | null;
  suitable_for:          string[] | null;
  interest_tags:         string[] | null;
  accessibility_features:string[] | null;

  // Facilities
  facilities:          string[] | null;
  parking_provision:   string[] | null;
  required_kit:        string[] | null;
  weather_suitability: string[] | null;
  seasonal_tag:        string[] | null;
  seasonal_highlights: string | null;
  terrain:             string[] | null;
  forThem:             string[] | null;
  forYou:            string[] | null;
  highlights:        string[] | null;
  perfectFor:        any[] | null;

  // Pricing
  is_free:          boolean | null;
  entry_cost:       string | null;
  price_info:       string | null;
  adult_price:      number | null;
  child_price:      number | null;
  infant_price:     number | null;
  family_price:     number | null;
  concession_price: number | null;
  pricingTiers:     PricingTier[];

  // Contact / links
  website_url:   string | null;
  booking_url:   string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Provider
  provider_id: string;

  // ── Venue only ────────────────────────────────────────
  opening_hours:           Record<string, { open?: string; close?: string }> | null;
  estimated_visit_duration:string | null;

  // ── Route only ────────────────────────────────────────
  route_type:       string | null;
  route_distance:   string | null;
  route_start_point:string | null;
  route_estimate_u5: string | null;
  route_estimate_510:string | null;
  route_estimate_10: string | null;
  difficulty_rating: string | null;
  dog_facilities:    string[] | null;
  bike_route:        boolean | null;
  scooter_route:     boolean | null;

  // ── Club only ─────────────────────────────────────────
  club_type:          string | null;
  club_commitment:    string | null;
  club_session_cost:  string | null;
  club_total_cost:    string | null;
  club_session_total: number | null;
  club_availability:  Record<string, string[]> | null;
  requires_booking:   boolean | null;

  // ── Event only ───────────────────────────────────────
  start_date:           string | null;
  end_date:             string | null;
  event_type:           string | null;
  event_times:          Record<string, string[]> | null;
  venue_name:           string | null;
  max_capacity:         number | null;
  spots_remaining:      number | null;
  is_online:            boolean | null;
  special_interest_tags:string[] | null;
  info_list:  any[] | null;

  // ── Computed ──────────────────────────────────────────
  liveStatus:        LiveStatus;
  seasonalHighlight: SeasonalHighlight | null;
}
