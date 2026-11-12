import { AppClock } from "./app-clock.js";
import { ukDateOf, weekdayOf, type DateLike, type TimeLike } from "./event-visibility.js";

/**
 * When a club is shown to families. Example:
 *   Club starts (club_start_date) 11/09/2026 at 09:00 (club_daily_start_time)
 *   Club ends   (club_end_date)   23/10/2026 at 11:00 (club_daily_end_time)
 *   → shown from 04/09/2026 00:00 (7 days before it starts), removed at 23/10/2026 11:00 (when its
 *     last session finishes, on its end date).
 * All dates/times are UK wall-clock (see AppClock).
 */

/** Shown this many days before the club's start date (from 00:00). */
export const CLUB_SHOW_DAYS_BEFORE_START = 7;

/** The club fields the visibility window reads. Works with both the raw asset `Club` (ISO strings)
 * and `OpportunityClubV2` (Dates). */
export interface ClubVisibilityFields {
  clubStartDate?: DateLike;
  clubEndDate?: DateLike;
  clubFixedDailyTimings?: boolean | null;
  clubDailyEndTime?: TimeLike;
  /** "09:00-11:00, 11:30-13:30" — sessions every day. */
  clubDailyFixedSessionSchedule?: TimeLike;
  clubMixedTimingsSundayEndTime?: TimeLike;
  clubMixedTimingsMondayEndTime?: TimeLike;
  clubMixedTimingsTuesdayEndTime?: TimeLike;
  clubMixedTimingsWednesdayEndTime?: TimeLike;
  clubMixedTimingsThursdayEndTime?: TimeLike;
  clubMixedTimingsFridayEndTime?: TimeLike;
  clubMixedTimingsSaturdayEndTime?: TimeLike;
  /** "09:00-11:00, 11:30-13:30" — sessions on that weekday. */
  clubMultiSessionSundaySchedule?: TimeLike;
  clubMultiSessionMondaySchedule?: TimeLike;
  clubMultiSessionTuesdaySchedule?: TimeLike;
  clubMultiSessionWednesdaySchedule?: TimeLike;
  clubMultiSessionThursdaySchedule?: TimeLike;
  clubMultiSessionFridaySchedule?: TimeLike;
  clubMultiSessionSaturdaySchedule?: TimeLike;
}

export interface ClubVisibilityWindow {
  /** First instant the club is shown (7 days before its start date, 00:00). Null = no lower bound. */
  showFrom: Date | null;
  /** Instant the club is removed. Null = no upper bound. */
  hideAt: Date | null;
}

/** Indexed by weekday, 0 = Sunday — matches AppClock.weekday(). */
const MIXED_END_FIELDS = [
  "clubMixedTimingsSundayEndTime",
  "clubMixedTimingsMondayEndTime",
  "clubMixedTimingsTuesdayEndTime",
  "clubMixedTimingsWednesdayEndTime",
  "clubMixedTimingsThursdayEndTime",
  "clubMixedTimingsFridayEndTime",
  "clubMixedTimingsSaturdayEndTime",
] as const satisfies readonly (keyof ClubVisibilityFields)[];

const MULTI_SESSION_FIELDS = [
  "clubMultiSessionSundaySchedule",
  "clubMultiSessionMondaySchedule",
  "clubMultiSessionTuesdaySchedule",
  "clubMultiSessionWednesdaySchedule",
  "clubMultiSessionThursdaySchedule",
  "clubMultiSessionFridaySchedule",
  "clubMultiSessionSaturdaySchedule",
] as const satisfies readonly (keyof ClubVisibilityFields)[];

/** Latest end time ("HH:MM") in a session schedule like "09:00-11:00, 11:30-13:30". Null if none parse. */
export function lastSessionEnd(schedule: TimeLike): string | null {
  if (!schedule) return null;
  let latest: { time: string; minutes: number } | null = null;
  for (const session of schedule.split(",")) {
    const end = session.split("-")[1]?.trim();
    const minutes = end ? AppClock.parseTimeToMinutes(end) : null;
    if (end && minutes !== null && (!latest || minutes > latest.minutes)) latest = { time: end, minutes };
  }
  return latest?.time ?? null;
}

/**
 * "HH:MM" the club's last session finishes on its end date: fixed daily end time first, then the
 * mixed timing for the end date's weekday, then that weekday's multi-session schedule, then the daily
 * fixed session schedule. Null when none is recorded for that day.
 */
export function resolveClubEndTime(club: ClubVisibilityFields): string | null {
  if (club.clubFixedDailyTimings && club.clubDailyEndTime) return club.clubDailyEndTime;
  const endDate = ukDateOf(club.clubEndDate);
  if (endDate) {
    const weekday = weekdayOf(endDate);
    const mixed = club[MIXED_END_FIELDS[weekday]!];
    if (mixed) return mixed;
    const multi = lastSessionEnd(club[MULTI_SESSION_FIELDS[weekday]!]);
    if (multi) return multi;
  }
  return lastSessionEnd(club.clubDailyFixedSessionSchedule);
}

/** "YYYY-MM-DD" shifted by `days` calendar days. */
function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

/**
 * When the club is shown:
 *   - showFrom: CLUB_SHOW_DAYS_BEFORE_START days before club_start_date, at 00:00. No start date → no
 *     lower bound.
 *   - hideAt: club_end_date at the time its last session finishes. No end time on that day → shown
 *     for the whole day (removed at the next midnight). No end date → no upper bound (ongoing club).
 */
export function getClubVisibilityWindow(club: ClubVisibilityFields): ClubVisibilityWindow {
  const startDate = ukDateOf(club.clubStartDate);
  const showFrom = startDate ? AppClock.fromWallClock(addDays(startDate, -CLUB_SHOW_DAYS_BEFORE_START), 0) : null;

  const endDate = ukDateOf(club.clubEndDate);
  let hideAt: Date | null = null;
  if (endDate) {
    const endTime = resolveClubEndTime(club);
    const endMinutes = endTime ? AppClock.parseTimeToMinutes(endTime) : null;
    hideAt = AppClock.fromWallClock(endDate, endMinutes ?? 24 * 60);
  }

  return { showFrom, hideAt };
}

/** Whether the club should be shown at `now`: on/after showFrom and before hideAt. */
export function isClubVisible(club: ClubVisibilityFields, now: Date = new Date()): boolean {
  const { showFrom, hideAt } = getClubVisibilityWindow(club);
  const t = now.getTime();
  if (showFrom && t < showFrom.getTime()) return false;
  if (hideAt && t >= hideAt.getTime()) return false;
  return true;
}
