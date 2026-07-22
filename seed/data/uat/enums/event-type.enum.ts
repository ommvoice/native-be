export interface EventTypeEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const EVENT_TYPE_ENUM: EventTypeEntry[] = [
  { name: "Social Gathering", slug: "social_gathering", active: true },
  { name: "Shared Meal", slug: "shared_meal", active: true },
  { name: "Workshop or talk", slug: "workshop_or_talk", active: true },
  { name: "Craft- or Skills-based", slug: "crafty_making", active: true },
  { name: "Festive", slug: "festive", active: true },
  { name: "Nature-based", slug: "nature_based", active: true },
  { name: "Formal Event or Dinner", slug: "formal_event", active: true },
  { name: "Agricultural or County Show", slug: "country_show", active: true },
  { name: "Festival", slug: "festival", active: true },
  { name: "Music", slug: "music_event", active: true },
  { name: "Performance", slug: "performance", active: true },
  { name: "Entertainment", slug: "entertainment", active: true },
  { name: "Sporting", slug: "sport_based", active: true },
  { name: "Foraging, Fruit Picking", slug: "foraging", active: true },
  { name: "Tasting Event", slug: "tasting_event", active: true },
  { name: "Themed", slug: "themed", active: true },
  { name: "PYO", slug: "pick_your_own", active: true },
  { name: "Family Funday", slug: "family_fun_day", active: true },
];

export type EventTypeSlug = (typeof EVENT_TYPE_ENUM)[number]["slug"];
