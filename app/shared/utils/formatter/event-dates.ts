import type { OpportunityEventV2 } from "../../types/opportunity-v2.types";
import { AppClock } from "../app-clock";

/**
 * Event date/time labels shared by the opportunity cards (recommendation-formatter) and the event
 * detail screen (event-to-opportunity) — own module so neither formatter imports the other.
 */

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Small event card status: "Coming Soon" before the start date; once started, the days left until
 * (and including) the end date — "10 days left", "1 day left", "Last day" on the end date itself.
 * Compared on the UK calendar day (AppClock). No usable dates, or already ended → undefined.
 */
export function eventCountdownLabel(
  startDate: Date | string | null,
  endDate: Date | string | null,
  now: Date = new Date(),
): string | undefined {
  // Stored as midnight UTC of the calendar day ("2026-11-06T00:00:00.000Z"), so the ISO date part is the day.
  const day = (raw: Date | string | null): string | null => {
    const iso = raw instanceof Date ? (Number.isNaN(raw.getTime()) ? null : raw.toISOString()) : raw;
    return iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : null;
  };
  const start = day(startDate);
  const end = day(endDate) ?? start;
  const today = AppClock.isoDateString(now);
  if (start && today < start) return "Coming Soon";
  if (!end || today > end) return undefined;
  const daysLeft = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
  if (daysLeft === 0) return "Last day";
  return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** Calendar day "YYYY-MM-DD" of a stored event date (Date or string, midnight UTC of that day). */
function eventDay(raw: Date | string | null | undefined): string | null {
  const iso = raw instanceof Date ? (Number.isNaN(raw.getTime()) ? null : raw.toISOString()) : raw;
  return iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : null;
}

/** 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th", 22 → "22nd", 28 → "28th". */
function ordinalDay(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** Event start date for the card: "Sat 28th Nov". */
export function eventStartDateLabel(startDate: Date | string | null | undefined): string | undefined {
  const day = eventDay(startDate);
  if (!day) return undefined;
  const d = new Date(`${day}T00:00:00.000Z`);
  return `${WEEKDAY_SHORT[(d.getUTCDay() + 6) % 7]} ${ordinalDay(d.getUTCDate())} ${MONTH_SHORT[d.getUTCMonth()]}`;
}

/**
 * Event start-finish time "10:00-12:00": the daily fixed times, else the weekly fixed times, else the
 * per-day (mixed) times of the first day it runs from the start date — or from today once it has
 * started (UK time). Null when the event has no times at all.
 */
export function eventSessionTime(event: OpportunityEventV2, now: Date = new Date()): string | undefined {
  const slot = (start: unknown, end: unknown) =>
    typeof start === "string" && start ? (typeof end === "string" && end ? `${start}-${end}` : start) : undefined;
  const fixed = slot(event.eventDailyFixedStartTime, event.eventDailyFixedEndTime)
    ?? slot(event.eventWeeklyFixedStartTime, event.eventWeeklyFixedEndTime);
  if (fixed) return fixed;

  // Mixed timings, Monday-first like WEEKDAY_NAMES.
  const e = event as unknown as Record<string, unknown>;
  const mixed = WEEKDAY_NAMES.map((name) => slot(e[`eventMixedTimings${name}Start`], e[`eventMixedTimings${name}End`]));
  if (mixed.every((t) => !t)) return undefined;
  const today = AppClock.isoDateString(now);
  const start = eventDay(event.eventStartDate);
  const from = start && start > today ? start : today;
  const fromDay = (new Date(`${from}T00:00:00.000Z`).getUTCDay() + 6) % 7;
  for (let i = 0; i < 7; i++) {
    const t = mixed[(fromDay + i) % 7];
    if (t) return t;
  }
  return undefined;
}

/** "Monday" / "monday" / "Mon" → 0 (Monday) .. 6 (Sunday); anything else → -1. */
function weekdayIndex(raw: string): number {
  const key = raw.trim().slice(0, 3).toLowerCase();
  return WEEKDAY_SHORT.findIndex((d) => d.toLowerCase() === key);
}

/** "YYYY-MM-DD" + n days. */
function addDays(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The event's next session: the first day from today (or from the start date, if later) up to the
 * end date that it actually runs — one of its eventTimetableWeekly days (none listed → every day) and,
 * with per-day timings, a day that has times. Today only counts while today's session hasn't finished
 * (UK time). Null when there's no session left (ended) or no dates.
 */
export function eventNextSession(event: OpportunityEventV2, now: Date = new Date()): { day: string; time?: string } | null {
  const start = eventDay(event.eventStartDate);
  const end = eventDay(event.eventEndDate) ?? start;
  if (!start && !end) return null;

  const slot = (s: unknown, e: unknown) =>
    typeof s === "string" && s ? (typeof e === "string" && e ? `${s}-${e}` : s) : undefined;
  const fixed = slot(event.eventDailyFixedStartTime, event.eventDailyFixedEndTime)
    ?? slot(event.eventWeeklyFixedStartTime, event.eventWeeklyFixedEndTime);
  const rec = event as unknown as Record<string, unknown>;
  const mixed = WEEKDAY_NAMES.map((name) => slot(rec[`eventMixedTimings${name}Start`], rec[`eventMixedTimings${name}End`]));
  const hasMixed = !fixed && mixed.some(Boolean);
  const runDays = new Set(
    String(event.eventTimetableWeekly ?? "").split(",").map(weekdayIndex).filter((d) => d >= 0),
  );

  const today = AppClock.isoDateString(now);
  const nowMinutes = AppClock.minutesSinceMidnight(now);
  const from = start && start > today ? start : today;

  // Up to a year ahead — enough for any real event; stops at the end date.
  for (let i = 0; i < 366; i++) {
    const day = addDays(from, i);
    if (end && day > end) break;
    const weekday = (new Date(`${day}T00:00:00.000Z`).getUTCDay() + 6) % 7;
    if (runDays.size > 0 && !runDays.has(weekday)) continue;
    if (hasMixed && !mixed[weekday]) continue;
    const time = fixed ?? mixed[weekday];
    if (day === today && time) {
      const finish = AppClock.parseTimeToMinutes(time.split("-")[1] ?? time.split("-")[0]!);
      if (finish != null && finish > 0 && nowMinutes >= finish) continue; // today's session is over
    }
    return { day, time };
  }
  return null;
}

/** Next session for the detail screen's Schedule card: "10:00-12:00, Fri 20th Nov" (no times → just the date). */
export function eventNextSessionLabel(event: OpportunityEventV2, now: Date = new Date()): string | undefined {
  const next = eventNextSession(event, now);
  if (!next) return undefined;
  return [next.time, eventStartDateLabel(next.day)].filter(Boolean).join(", ");
}
