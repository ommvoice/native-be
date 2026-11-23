import type { OpportunityEventV2 } from "../types/opportunity-v2.types.js";
import { AppClock } from "./app-clock.js";
import { lastSessionEnd } from "./club-visibility.js";
import { ukDateOf } from "./event-visibility.js";
import { eventNextSession, eventSessionOn } from "./formatter/event-dates.js";

/**
 * "Which day is this activity on?" helpers for Nearby ideas: the viewed activity's day, and whether
 * a nearby event/club runs on that day. Days are UK calendar days ("YYYY-MM-DD", see AppClock).
 * Works on the raw asset records (ISO strings) and the enriched payloads (Dates) alike.
 */

type RawRecord = Record<string, unknown>;

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** "YYYY-MM-DD" + n days. */
function addDays(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 0 = Monday .. 6 = Sunday for a "YYYY-MM-DD" day. */
function mondayFirstWeekday(isoDay: string): number {
  return (new Date(`${isoDay}T00:00:00.000Z`).getUTCDay() + 6) % 7;
}

/** "Monday" / "mon" → 0 .. "Sunday" → 6; anything else → -1. */
function weekdayIndex(raw: string): number {
  const key = raw.trim().slice(0, 3).toLowerCase();
  return DAY_NAMES.findIndex((d) => d.slice(0, 3).toLowerCase() === key);
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/** Weekdays (0 = Monday) the club runs: clubDailySchedule, or — when that's empty — the days with
 * mixed timings or a multi-session schedule. */
function clubWeekdays(club: RawRecord): Set<number> {
  const listed = String(club.clubDailySchedule ?? "").split(",").map(weekdayIndex).filter((d) => d >= 0);
  if (listed.length) return new Set(listed);
  return new Set(
    DAY_NAMES.flatMap((name, i) =>
      str(club[`clubMixedTimings${name}StartTime`]) || str(club[`clubMultiSession${name}Schedule`]) ? [i] : [],
    ),
  );
}

/** "HH:MM" the club's last session that weekday finishes; null when no time is recorded. */
function clubFinishOn(club: RawRecord, weekday: number): string | null {
  const name = DAY_NAMES[weekday]!;
  if (club.clubFixedDailyTimings === true && str(club.clubDailyEndTime)) return str(club.clubDailyEndTime);
  return str(club[`clubMixedTimings${name}EndTime`])
    ?? lastSessionEnd(str(club[`clubMultiSession${name}Schedule`]))
    ?? lastSessionEnd(str(club.clubDailyFixedSessionSchedule));
}

/** Whether the club has a session on `day`: between its start and end dates, on one of its weekdays,
 * and — when `day` is today — its last session hasn't finished yet. No weekdays recorded → false. */
export function clubRunsOn(club: RawRecord, day: string, now: Date = new Date()): boolean {
  const start = ukDateOf(club.clubStartDate as string | Date | null | undefined);
  const end = ukDateOf(club.clubEndDate as string | Date | null | undefined);
  if ((start && day < start) || (end && day > end)) return false;

  const weekday = mondayFirstWeekday(day);
  if (!clubWeekdays(club).has(weekday)) return false;

  if (day === AppClock.isoDateString(now)) {
    const finish = clubFinishOn(club, weekday);
    const minutes = finish ? AppClock.parseTimeToMinutes(finish) : null;
    if (minutes != null && minutes > 0 && AppClock.minutesSinceMidnight(now) >= minutes) return false;
  }
  return true;
}

/** The club's next session day from today (or its start date, if later); null when none is left. */
export function clubNextSessionDay(club: RawRecord, now: Date = new Date()): string | null {
  const today = AppClock.isoDateString(now);
  const start = ukDateOf(club.clubStartDate as string | Date | null | undefined);
  const end = ukDateOf(club.clubEndDate as string | Date | null | undefined);
  const from = start && start > today ? start : today;
  for (let i = 0; i < 366; i++) {
    const day = addDays(from, i);
    if (end && day > end) break;
    if (clubRunsOn(club, day, now)) return day;
  }
  return null;
}

/** Whether the event has a session on `day` (see eventSessionOn). */
export function eventRunsOn(event: RawRecord, day: string, now: Date = new Date()): boolean {
  return eventSessionOn(event as unknown as OpportunityEventV2, day, now) !== null;
}

/**
 * The day the viewed activity is on: an event's or club's next session (the day its Schedule card
 * shows); a venue, route, unknown record, or an event/club with no session left → today.
 */
export function activityDay(type: string | null | undefined, record: RawRecord | null | undefined, now: Date = new Date()): string {
  const today = AppClock.isoDateString(now);
  if (!record) return today;
  if (type === "event") return eventNextSession(record as unknown as OpportunityEventV2, now)?.day ?? today;
  if (type === "club") return clubNextSessionDay(record, now) ?? today;
  return today;
}
