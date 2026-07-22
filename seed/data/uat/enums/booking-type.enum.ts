export interface BookingTypeEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const BOOKING_TYPE_ENUM: BookingTypeEntry[] = [
  { name: "Advance Book", slug: "advance_book", active: true },
  { name: "Pay On Arrival", slug: "pay_on_arrival", active: true },
  { name: "Open (Free) Access", slug: "open_access", active: true },
  { name: "Pre-Register", slug: "pre_register", active: true },
  { name: "Memberships", slug: "members_only", active: true },
];

export type BookingTypeSlug = (typeof BOOKING_TYPE_ENUM)[number]["slug"];
