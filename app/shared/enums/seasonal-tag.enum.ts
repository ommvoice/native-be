export interface SeasonalTagEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const SEASONAL_TAG_ENUM: SeasonalTagEntry[] = [
  { name: "Christmas", slug: "christmas", active: true },
  { name: "Advent", slug: "advent", active: true },
  { name: "Winter", slug: "winter", active: true },
  { name: "Valentine’s", slug: "valentines", active: true },
  { name: "Winter solstice", slug: "winter_solstice", active: true },
  { name: "Springtime", slug: "spring_flowers", active: true },
  { name: "Easter", slug: "easter", active: true },
  { name: "Lent", slug: "lent", active: true },
  { name: "Autumn", slug: "autumn", active: true },
  { name: "Summer", slug: "summer", active: true },
  { name: "Summer solstice", slug: "summer_solstice", active: true },
  { name: "Autumn colours", slug: "autumn_colours", active: true },
  { name: "Halloween", slug: "halloween", active: true },
  { name: "Guy Fawkes", slug: "guy_fawkes", active: true },
  { name: "Summer holiday clubs", slug: "summer_holiday_clubs", active: true },
  { name: "Half term clubs", slug: "half_term_clubs", active: true },
];

export type SeasonalTagSlug = (typeof SEASONAL_TAG_ENUM)[number]["slug"];
