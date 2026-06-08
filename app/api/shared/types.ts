export type OppType = 'venue' | 'route' | 'club' | 'event';

export interface Opportunity {
  id: string;
  type: OppType;
  title: string;
  image: any;
  duration: string;
  tags: string[];
  price: string;
  travelTime: string;
  isFavorite?: boolean;
  icons?: string[];
  priceValue?: number;
  distanceKm?: number;
  durationMin?: number;
  description?: string;
  amenitiesForThem?: { icon: string; label: string }[];
  amenitiesForYou?: { icon: string; label: string }[];
  location?: {
    latitude: string | null;
    longitude: string | null;
  } | null;
}

export interface OpportunityDetail {
  // ── Core (all types) ──────────────────────────────────
  id: string;
  opp_type: OppType;
  name: string;
  description: string | null;
  image_urls: string[] | null;

  // Location
  address: string | null;
  city: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;

  // Classification
  interest_category: string | null;
  opp_category: string | null;
  subcategory: string | null;
  activity_effort_tag: string | null;

  // Suitability
  min_age: number | null;
  max_age: number | null;
  suitable_for: string[] | null;
  interest_tags: string[] | null;
  accessibility_features: string[] | null;

  // Facilities
  facilities: string[] | null;
  parking_provision: string[] | null;
  required_kit: string[] | null;
  weather_suitability: string[] | null;
  seasonal_tag: string[] | null;
  seasonal_highlights: string | null;
  terrain: string[] | null;

  // Pricing (venue, club, event)
  is_free: boolean | null;
  entry_cost: string | null;
  price_info: string | null;
  adult_price: number | null;
  child_price: number | null;
  infant_price: number | null;
  family_price: number | null;
  concession_price: number | null;

  // Contact / links
  website_url: string | null;
  booking_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Provider
  provider_id: string;

  // ── Venue only ────────────────────────────────────────
  opening_hours: Record<string, { open?: string; close?: string }> | null;
  estimated_visit_duration: string | null;

  // ── Route only ────────────────────────────────────────
  route_type: string | null;              // 'walking' | 'cycling' | 'scooter'
  route_distance: string | null;          // e.g. "3.2km"
  route_start_point: string | null;
  route_estimate_u5: string | null;       // time estimate for under-5s
  route_estimate_510: string | null;      // time estimate for 5-10s
  route_estimate_10: string | null;       // time estimate for 10+
  difficulty_rating: string | null;       // 'easy' | 'moderate' | 'challenging' | 'difficult'
  dog_facilities: string[] | null;
  bike_route: boolean | null;
  scooter_route: boolean | null;
  opportunity_theme_variant: string | null;

  // ── Club only ────────────────────────────────────────
  club_type: string | null;
  club_commitment: string | null;         // 'drop_in' | 'weekly' | 'term' etc.
  club_session_cost: string | null;
  club_total_cost: string | null;
  club_session_total: number | null;
  club_availability: Record<string, string[]> | null;  // { monday: ['09:00', '10:30'] }
  requires_booking: boolean | null;

  // ── Event only ───────────────────────────────────────
  start_date: string | null;
  end_date: string | null;
  event_type: string | null;
  event_times: Record<string, string[]> | null;
  venue_name: string | null;
  max_capacity: number | null;
  spots_remaining: number | null;
  is_online: boolean | null;
  special_interest_tags: string[] | null;

  org?: any; // Include original data for debugging - to be removed
}
