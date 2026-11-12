import { AppClock } from "./app-clock.js";

/**
 * When an event is shown to families. Example:
 *   Event starts (event_start_date) 07/12/2026 at 16:00 (event_mixed_timings_monday_start_time)
 *   Event ends   (event_end_date)   07/12/2026 at 18:00 (event_mixed_timings_monday_end_time)
 *   Promotion starts (ticket_sales_start_date) 01/11/2026
 *   → shown from 01/11/2026 00:00, removed at 07/12/2026 17:00 (1 hour before it finishes, on its end date).
 * All dates/times are UK wall-clock (see AppClock).
 */

/** Removed this long before the event's end time on its end date. */
export const EVENT_HIDE_BEFORE_END_MINUTES = 60;

export type DateLike = Date | string | null | undefined;
export type TimeLike = string | null | undefined;

/** The event fields the visibility window reads. Works with both the raw asset `Event` (ISO strings)
 * and `OpportunityEventV2` (Dates). */
export interface EventVisibilityFields {
  eventStartDate?: DateLike;
  eventEndDate?: DateLike;
  ticketSalesStartDate?: DateLike;
  eventDailyFixedTimings?: boolean | null;
  eventDailyFixedEndTime?: TimeLike;
  eventWeeklyFixedEndTime?: TimeLike;
  eventMixedTimingsSundayEnd?: TimeLike;
  eventMixedTimingsMondayEnd?: TimeLike;
  eventMixedTimingsTuesdayEnd?: TimeLike;
  eventMixedTimingsWednesdayEnd?: TimeLike;
  eventMixedTimingsThursdayEnd?: TimeLike;
  eventMixedTimingsFridayEnd?: TimeLike;
  eventMixedTimingsSaturdayEnd?: TimeLike;
}

export interface EventVisibilityWindow {
  /** First instant the event is shown (promotion start date at 00:00). Null = no lower bound. */
  showFrom: Date | null;
  /** Instant the event is removed. Null = no upper bound. */
  hideAt: Date | null;
}

/** Indexed by weekday, 0 = Sunday — matches AppClock.weekday(). */
const MIXED_END_FIELDS = [
  "eventMixedTimingsSundayEnd",
  "eventMixedTimingsMondayEnd",
  "eventMixedTimingsTuesdayEnd",
  "eventMixedTimingsWednesdayEnd",
  "eventMixedTimingsThursdayEnd",
  "eventMixedTimingsFridayEnd",
  "eventMixedTimingsSaturdayEnd",
] as const satisfies readonly (keyof EventVisibilityFields)[];

/** UK calendar day ("YYYY-MM-DD") of a stored date. Dates are stored as midnight (UTC or UK), and
 * both land on the intended UK day. Null when missing or unparseable. */
export function ukDateOf(value: DateLike): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : AppClock.isoDateString(d);
}

/** 0 = Sunday .. 6 = Saturday for a "YYYY-MM-DD" calendar day. */
export function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

/**
 * "HH:MM" the event finishes on its end date, using the same precedence as event-to-opportunity's
 * resolveEventTimeRange: daily fixed timing, then weekly fixed, then the mixed timing for the end
 * date's weekday. Null when none is recorded.
 */
export function resolveEventEndTime(event: EventVisibilityFields): string | null {
  if (event.eventDailyFixedTimings && event.eventDailyFixedEndTime) return event.eventDailyFixedEndTime;
  if (event.eventWeeklyFixedEndTime) return event.eventWeeklyFixedEndTime;
  const endDate = ukDateOf(event.eventEndDate ?? event.eventStartDate);
  if (!endDate) return null;
  return event[MIXED_END_FIELDS[weekdayOf(endDate)]!] ?? null;
}

/**
 * When the event is shown:
 *   - showFrom: ticket_sales_start_date at 00:00. No promotion date → no lower bound.
 *   - hideAt: event_end_date at its end time minus EVENT_HIDE_BEFORE_END_MINUTES. No end date → the
 *     start date is used. No end time on that day → shown for the whole day (removed at the next
 *     midnight). No dates at all → no upper bound.
 */
export function getEventVisibilityWindow(event: EventVisibilityFields): EventVisibilityWindow {
  const salesDate = ukDateOf(event.ticketSalesStartDate);
  const showFrom = salesDate ? AppClock.fromWallClock(salesDate, 0) : null;

  const endDate = ukDateOf(event.eventEndDate ?? event.eventStartDate);
  let hideAt: Date | null = null;
  if (endDate) {
    const endTime = resolveEventEndTime(event);
    const endMinutes = endTime ? AppClock.parseTimeToMinutes(endTime) : null;
    hideAt = endMinutes === null
      ? AppClock.fromWallClock(endDate, 24 * 60)
      : AppClock.fromWallClock(endDate, endMinutes - EVENT_HIDE_BEFORE_END_MINUTES);
  }

  return { showFrom, hideAt };
}

/** Whether the event should be shown at `now`: on/after showFrom and before hideAt. */
export function isEventVisible(event: EventVisibilityFields, now: Date = new Date()): boolean {
  const { showFrom, hideAt } = getEventVisibilityWindow(event);
  const t = now.getTime();
  if (showFrom && t < showFrom.getTime()) return false;
  if (hideAt && t >= hideAt.getTime()) return false;
  return true;
}
