/**
 * Centralizes "what's the current UK wall-clock time / day / date" behind one time zone constant
 * (TIME_ZONE below). AWS Lambda's runtime clock is UTC — plain `Date#getHours()`/`getDay()`/`getMonth()`
 * etc. read UTC, not British time, so any schedule/opening-status/day-of-week logic built on them is
 * silently wrong by an hour for roughly half the year (BST, UTC+1, runs late March–late October) and can
 * even land on the wrong calendar day close to midnight. Every such calculation should go through
 * `AppClock` instead of calling `Date` methods directly — to change the zone the app runs on, this is
 * the only line that needs to change.
 */
const TIME_ZONE = "Europe/London";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export interface AppClockParts {
  year: number;
  /** 0–11, matching JS Date's own month indexing. */
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** 0 = Sunday .. 6 = Saturday, matching Date#getDay(). */
  weekday: number;
}

export class AppClock {
  static readonly TIME_ZONE = TIME_ZONE;

  private static readonly formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    weekday: "short", hour12: false,
  });

  /** Breaks `date` (default: now) into its UK wall-clock components. */
  static parts(date: Date = new Date()): AppClockParts {
    const raw = Object.fromEntries(
      AppClock.formatter.formatToParts(date).map((p) => [p.type, p.value])
    ) as Record<string, string>;
    // Some ICU implementations render midnight as "24" rather than "00" under hour12:false.
    const hours = raw.hour === "24" ? 0 : Number(raw.hour);
    return {
      year:    Number(raw.year),
      month:   Number(raw.month) - 1,
      day:     Number(raw.day),
      hours,
      minutes: Number(raw.minute),
      seconds: Number(raw.second),
      weekday: WEEKDAY_INDEX[raw.weekday ?? ""] ?? 0,
    };
  }

  /** "HH:MM" as currently shown on a UK wall clock — use instead of manually padding getHours()/getMinutes(). */
  static timeString(date: Date = new Date()): string {
    const p = AppClock.parts(date);
    return `${String(p.hours).padStart(2, "0")}:${String(p.minutes).padStart(2, "0")}`;
  }

  /** UK calendar date as "YYYY-MM-DD" — same convention as a child's stored dateOfBirth, so it can
   * be compared with plain string `<`/`>=` (e.g. guest-child expireDate) without parsing back into
   * a Date. Use instead of `date.toISOString().slice(0, 10)`, which reads the UTC calendar day and
   * can land on the wrong date close to midnight UK time. */
  static isoDateString(date: Date = new Date()): string {
    const p = AppClock.parts(date);
    return `${p.year}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  }

  /** Full UK wall-clock date+time, en-GB formatted (e.g. "Tue, 18/08/2026, 14:30:05") — a human-readable companion to the machine-readable ISO timestamp, representing the exact instant startTime/endTime were compared against. */
  static dateTimeString(date: Date = new Date()): string {
    return AppClock.formatter.format(date);
  }

  /** 0 = Sunday .. 6 = Saturday, as seen in the UK — use instead of `date.getDay()`. */
  static weekday(date: Date = new Date()): number {
    return AppClock.parts(date).weekday;
  }

  /** Minutes since midnight on the UK wall clock — compares two times-of-day without building Date objects (which would need `setHours` to run in the UK zone, and JS Date has no such thing). */
  static minutesSinceMidnight(date: Date = new Date()): number {
    const p = AppClock.parts(date);
    return p.hours * 60 + p.minutes;
  }

  /** Parses an "HH:MM" (or "HH:MM:SS") string into minutes since midnight, for comparing against `minutesSinceMidnight()`. Null if unparseable. */
  static parseTimeToMinutes(time: string): number | null {
    const match = time.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  /**
   * UTC-midnight-anchored Date representing `date`'s UK calendar day. Safe to compare with `<`/`>`/
   * `getTime()` against another value produced the same way, regardless of either input's own
   * time-of-day or the server's runtime time zone — use instead of
   * `new Date(d.getFullYear(), d.getMonth(), d.getDate())`, which builds the day as seen by the
   * server's runtime zone rather than the UK's.
   */
  static calendarDay(date: Date = new Date()): Date {
    const p = AppClock.parts(date);
    return new Date(Date.UTC(p.year, p.month, p.day));
  }

  /**
   * The instant a UK wall clock shows `minutesSinceMidnight` on the UK calendar day `isoDate`
   * ("YYYY-MM-DD") — the inverse of `isoDateString()` + `minutesSinceMidnight()`. GMT/BST is handled,
   * so "2026-07-01" at 16:00 is 15:00Z and "2026-12-07" at 16:00 is 16:00Z. Minutes past 24:00 roll
   * into the next day. Null when `isoDate` isn't a valid "YYYY-MM-DD".
   */
  static fromWallClock(isoDate: string, minutesSinceMidnight = 0): Date | null {
    const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const wallAsUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, minutesSinceMidnight);
    if (Number.isNaN(wallAsUtc)) return null;
    // Offset of the UK zone from UTC at a given instant, in ms (0 in GMT, +1h in BST).
    const offsetAt = (t: number) => {
      const p = AppClock.parts(new Date(t));
      return Date.UTC(p.year, p.month, p.day, p.hours, p.minutes, p.seconds) - t;
    };
    // Two passes so a time on a clock-change day settles on the offset in force at that instant.
    let t = wallAsUtc - offsetAt(wallAsUtc);
    t = wallAsUtc - offsetAt(t);
    return new Date(t);
  }

  /** Whether `a` and `b` fall on the same UK calendar day. */
  static isSameCalendarDay(a: Date, b: Date): boolean {
    return AppClock.calendarDay(a).getTime() === AppClock.calendarDay(b).getTime();
  }
}
